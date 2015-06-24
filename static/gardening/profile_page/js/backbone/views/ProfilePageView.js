var ProfilePageView = Backbone.View.extend({

	el: ".profile-page",

	isEditMode: false,
	isBlurbExpanded: false,

	events: {
		"click .p-header-edit-btn": "_toggleEditMode",
		"keyup #id_zipcode": "_updateCityStateFromZipCode",
		"change #id_city": "_updateZipCodeFromCityState",
		"change #id_state": "_updateZipCodeFromCityState",
		"change #id_profile_pic": "_saveProfilePic",
		"click .expand-blurb": "_expandBlurb",
	},

	// @desc: Toggle the Text Blurb Expandion
	// @params: Even Object
	// @res: Void
	_expandBlurb: function (event) {
		if (this.isBlurbExpanded) {
			$(event.currentTarget).html("About Me (click to expand)");
			$(event.currentTarget).parents(".expandable-blurb")
								  .removeAttr("style");
		} else {
			$(event.currentTarget).html("About Me (click to hide)");
			$(event.currentTarget).parents(".expandable-blurb")
							  	  .css({height:"initial", minHeight: "60px"});
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

	// @desc: Toggles the Edit Mode of the Profile Header
	// @params: None
	// @res: Void
	_toggleEditMode: function () {
		if (this.isEditMode) {
			this.$el.find(".profile-header-pic").removeClass("push-down");
			this.$el.find(".profile-header").removeClass("hidden");
			this._saveProfile(_.bind(function () {
				this.$el.find("input, select, textarea").removeClass("error");
				this.$el.find(".field-error").html("");
				this.$el.find(".edit-profile-header").addClass("hidden");
			}, this),
			_.bind(function (response) {
		   		var highlight_error,
		   			error_selectors = [],
		   			property,
		   			idx,
		   			error_msg_selector;
		   		this.$el.find(".profile-header").addClass("hidden");
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
			this.$el.find(".profile-header").addClass("hidden");
			this.$el.find(".edit-profile-header").removeClass("hidden");
			this.$el.find(".profile-header-pic").addClass("push-down");
		}
		this.isEditMode = !this.isEditMode;
	},

	// @desc: Initialize a Slick Image Carousel for the plant images
	// @params: None
	// @res: Void
	_initializePlantCarousel: function () {
		this.$el.find(".img-carousel").slick({
			accessibility: true,
			infinite: true,
			adaptiveHeight: true,
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