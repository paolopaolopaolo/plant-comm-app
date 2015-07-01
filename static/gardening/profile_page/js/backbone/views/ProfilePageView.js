var ProfilePageView = Backbone.View.extend({

	el: ".profile-page",

	isEditMode: false,
	isBlurbExpanded: false,
	isPlantEditable: {},

	events: {
		"click .p-header-edit-btn": "_toggleEditMode",
		"keyup #id_zipcode": "_updateCityStateFromZipCode",
		"change #id_city": "_updateZipCodeFromCityState",
		"change #id_state": "_updateZipCodeFromCityState",
		"change #id_profile_pic": "_saveProfilePic",
		"click .expand-blurb": "_expandBlurb",
		"click .edit-plant": "_togglePlantEdit",
	},

	// @desc: Internal: Get the desired jQuery object using a parent, a 
	// 		  parameter, and a type ("edit" or "display")
	// @params: jQuery Object, String, String
	// @res: jQuery Object
	_getJQueryElement: function ($parent, param_string, type) {
		return $parent.find([".id", param_string, type].join("-"));
	},

	// @desc: Toggle Plant input, accounting for which plant,
	// 		  which input, and which state it is currently in
	// @params: jQuery Object, String, String
	// @res: Void
	_togglePlantMode: function($plant_content, param_string, option) {
		var value_to_save, $display, $input;

		$input = this._getJQueryElement(
											$plant_content,
											param_string,
											"edit"
										);
		$display = this._getJQueryElement(
											$plant_content,
											param_string,
											"display"
										);

		if (option === "display") {
			value_to_save = $input.val();
			$display.show();
			$input.hide();
		} else if (option === "edit") {
			$display.hide();
			$input.show();
		}
	},

	// @desc: Toggles the Editability of Plant Items
	// @params: Event object
	// @res: Void
	_togglePlantEdit: function (event) {
		var $plant_content,
			_id,
			target_attr,
			$icon;

		// Set $plant_content to the plant panel
		$plant_content = $(event.currentTarget).parents(".plant-text");
		// Get plant-id from hidden input
		_id = parseInt($plant_content.children("input[name='plant-id']").val(), 10);
		// Get target parameter from hidden input
		target_attr = $(event.currentTarget).children("input[name='param']").val();
		// Get the icon-to-change
		$icon = $(event.currentTarget).children(".fa");
		
		if (this.isPlantEditable[_id][target_attr]) {
			// If the plant is already editable, trigger
			// to non-editable display
			this._togglePlantMode($plant_content, target_attr, "display");
			// Change icon from checkmark to pencil
			$icon.removeClass("fa-check");
			$icon.addClass("fa-pencil");
		} else {
			// If plant is not yet editable, trigger
			// to input mode
			this._togglePlantMode($plant_content, target_attr, "edit");
			// Change icon from pencil to checkmark
			$icon.addClass("fa-check");
			$icon.removeClass("fa-pencil");
		}
		// Toggle the value from bool(x) to !bool(x).
		this.isPlantEditable[_id][target_attr] = !this.isPlantEditable[_id][target_attr];
	},

	// @desc: Toggle the Text Blurb Expandion
	// @params: Event Object
	// @res: Void
	_expandBlurb: function (event) {
		if (this.isBlurbExpanded) {
			$(event.currentTarget).html("About Me <span class='ab-desc'>(click to expand)</span>");
			$(event.currentTarget).parents(".expandable-blurb")
								  .removeAttr("style");
			$(event.currentTarget).parents(".expandable-blurb")
								  .find(".handler-text_blurb")
								  .addClass("text-fade");			
		} else {
			$(event.currentTarget).html("About Me <span class='ab-desc'>(click to hide)</span>");
			$(event.currentTarget).parents(".expandable-blurb")
							  	  .css({
							  	  			height:"initial",
							  	  			minHeight: "60px"
							  	  		});
			$(event.currentTarget).parents(".expandable-blurb")
								  .find(".handler-text_blurb")
								  .removeClass("text-fade");
		}
		this.isBlurbExpanded = !this.isBlurbExpanded;
	},

	// @HACK
	// @desc: Resets the profile pic image with the new image 
	// @params: Backbone Model Object
	// @res: Void
	_reRenderProfilePic: function (model) {
		var field_height, field_width; 
		this.$el.find(".profile-header-pic")
				.attr("src", model.attributes["profile_pic"]);
		this.trigger("profilePicChange", model.attributes["profile_pic"]);
	},

	// @HACK
	// @desc: Saves the profile picture and gets back a URL
	// @params: Event Object
	// @res: Void
	_saveProfilePic: function (event) {
		var xhr_object, fake_form;
		// Create the xhr object to send
		// method: POST

		fake_form = document.createElement('form');
		fake_form.setAttribute('enctype', 'multipart/form-data');

		xhr_object = {
			'url' : 'gardener/pic',
			'method' : 'POST',
			'contentType': false,
			'processData': false,
			'data': new FormData(fake_form)
		};

		xhr_object['data'].append('profile_pic', event.target.files[0]);

		// Send AJAX POST request; on finish, change the image
		$.ajax(xhr_object).done(_.bind(function (response) {
			this.gardener_model.set({'profile_pic': response['profile_pic']});
		}, this));
	},

	// @desc: Populate Zipcode Field from City and State
	// @params: None
	// @res: Void
	_updateZipCodeFromCityState: function () {
		var model_object = this._objectifyProfileForm(),
			zip_value = model_object["zipcode"],
			city = model_object["city"],
			state = model_object["state"],
			$zip = this.$el.find("#id_zipcode");

		if (city.length > 0 && state.length > 0) {
			$.ajax({
				method: "GET",
				url: "/zap",
				data: {
					zipcode: "",
					city : city,
					state: state,
					option: "city-zips.json"
				}, 
			}).done(_.bind(function (response) {
				$zip.val(response.zipcode);
			}, this));
		} 
	},

	// @desc: Populate from ZipCode the City and State Fields
	// @params: Event Object
	// @res: Void
	_updateCityStateFromZipCode: function (event) {
		var zip_value = $(event.currentTarget).val(), $city, $state;

		$city = this.$el.find("#id_city");
		$state = this.$el.find("#id_state");

		if (zip_value.length === 5) {
			$.ajax({
				method: "GET",
				url: "/zap",
				data: {
					zipcode : zip_value.toString(),
					option: "info.json"
				}, 
			}).done(_.bind(function (response) {
				$city.val(response.city);
				$state.val(response.state);
			}, this));
		} else if ($(event.currentTarget).val().length > 5) {
			event.preventDefault();
		}
	},

	// @desc: Get input from .profile-form in JS Object Format
	// @params: None
	// @res: Object
	_objectifyProfileForm: function () {
		var form_items, result = {};
		form_items = this.$el
					 .find(".profile-form")
					 .serializeArray();

		_.each(form_items, function (item) {
			result[item["name"]] = item["value"];
		});

		return result;
	},

	// @desc: Save the profile
	// @params: Function, Function
	// @res: Void
	_saveProfile: function (callback_success, callback_failure) {
		var form_items, object_to_save = {};

		object_to_save = this._objectifyProfileForm();

		this.gardener_model.save(object_to_save)
						   .done(callback_success)
						   .fail(callback_failure);
	},

	// @desc: Throttles the Toggle effect to once every second
	// @params: None
	// @res: Void
	_throttleToggleEditMode: function () {
		this._toggleEditMode = _.debounce(_.bind(this._toggleEditMode, this), 1000, true);
	},

	// @desc: Sets all the styles for Non-editable profile display mode
	// @params: None
	// @res: Void
	_displayMode: function () {
		this.$el.find(".profile-header").removeClass("hidden");
		this.$el.find(".edit-profile-header").addClass("hidden");
		this.$el.find(".profile-header-pic").removeClass("push-down");
		this.isEditMode = false;
	},

	// @desc: Sets all the styles for Editable profile display mode
	// @params: None
	// @res: Void
	_editMode: function () {
		this.$el.find(".profile-header").addClass("hidden");
		this.$el.find(".edit-profile-header").removeClass("hidden");
		this.$el.find(".profile-header-pic").addClass("push-down");
		this.isEditMode = true; 
	},

	// @desc: Toggles the Edit Mode of the Profile Header
	// @params: None
	// @res: Void
	_toggleEditMode: function () {
		if (this.isEditMode) {
			this._saveProfile(_.bind(function () {
				this.$el.find("input, select, textarea").removeClass("error");
				this.$el.find(".field-error").html("");
				this._displayMode();
			}, this),
			_.bind(function (response) {
		   		var highlight_error,
		   			error_selectors = [],
		   			property,
		   			idx,
		   			error_msg_selector;
		   		highlight_error = JSON.parse(response.responseText);
		   		for (property in highlight_error) {
		   			if (highlight_error.hasOwnProperty(property)) {
		   				error_selectors.push(["#id", property].join("_"));
		   			}
		   		}

		   		for (idx = 0; idx < error_selectors.length; idx++) {
		   			error_msg_selector = [
		   									error_selectors[idx],
		   									"error"
		   								 ].join("-");
		   			this.$el
		   				.find(error_selectors[idx])
		   				.addClass("error");
		   			this.$el
		   				.find(error_msg_selector)
		   				.html(highlight_error[property]);
		   		}
		   }, this));
		} else {
			this._editMode();
		}
	},

	// @desc: Initialize a Slick Image Carousel for the plant images
	// @params: None
	// @res: Void
	_initializePlantCarousel: function () {
		this.$el.find(".img-carousel").slick({
			accessibility: true,
			infinite: true,
			adaptiveHeight: true,
			variableWidth: true,
		});
	},

	// @desc: For each of the changed attributes, update the appropriate UI
	// @params: Backbone Model Object
	// @res: Void
	_changeAttr: function (model) {
		var property, changed, trigger_object = {};
		changed = model.changed;
		for (property in changed) {
			if (changed.hasOwnProperty(property)) {
				if (property !== "profile_pic") {
					trigger_object[property] = changed[property];
					this.trigger("changeAttribute", trigger_object);
					trigger_object = {};
				}
				else {
					this._reRenderProfilePic(model);
				}
			}
		}
	},

	// @desc: Scripts started when navigated to the Profile Page
	// @params: Object, Object
	// @res: Void
	initialize: function (gardener, plants) {
		// Set Model and Collection
		this.gardener_model = new Gardener(gardener);
		this.plants_collection = new Plants(plants);

		// Initialize isPlantEditable object
		this.plants_collection.each(_.bind(function (model) {
			this.isPlantEditable[model.attributes['id']] = {};
			this.isPlantEditable[model.attributes['id']]["species"] = false;
			this.isPlantEditable[model.attributes['id']]["quantity"] = false;
			this.isPlantEditable[model.attributes['id']]["information"] = false;
		}, this));

		this.$el.find(".edit-input")
				.hide();

		// Initialize the Plant Img Carousel
		this._initializePlantCarousel();
		// Set the toggleEditMode method to a debounced version
		this._throttleToggleEditMode();

		// Set event listeners
		this.listenTo(this.gardener_model, "change", this._changeAttr);
		bv.listenTo(this, "changeAttribute", bv.propagateChanges);
		bv.header_view.listenTo(this, "profilePicChange", bv.header_view.profilePicChange);
	},

});

bv.profile_view = new ProfilePageView(GARDENER, PLANTS);