var PlantView = Backbone.View.extend({

	el: ".plant-content",
	template: _.template($("#plant-template").html()),

	plant_img_views: {},
	isPlantEditable: {},

	events: {
		"click .edit-plant": "_togglePlantEdit",
		"click .add-plant": "_addPlant",
		"click .delete-plant": "_deletePlant",
	},

	// @desc: From UI, deletes a model
	// @params: Event Object
	// @res: Void
	_deletePlant: function (event) {
		var _id, isDeleteConfirmed, target_model;

		_id = $(event.currentTarget).siblings(".plant-text")
									.find("input[name='plant-id']")
									.val();
		target_model = this.collection.get(_id);
		if (target_model.isNew()) {
			isDeleteConfirmed = confirm("Cancel adding this plant?");
		} else {
			isDeleteConfirmed = confirm("Delete this plant?");
		}

		if (isDeleteConfirmed) {
			target_model.destroy();
		}
	},

	// @desc: Function that deletes view/UI elements as a result of "remove" trigger
	// @params: Backbone Model Object, Backbone Collection Object, Simple JS Object
	// @res: Void
	_removePlantView: function (model, collection, options) {
		var _id = model.attributes["id"],
			_cid = model.cid,
			target;
		if (model.isNew()) {
			target = _cid;
		} else {
			target = _id.toString();
		}
		this.$el.find(".plant-item-" + target).remove();
		this._updateProfileHeaderPlantCount();
	},

	// @desc: Get a JS object of all the plant's inputs
	// @param: Event object OR Integer
	// @res: Simple JS Object
	_jsonifyPlant: function (event) {
		var result = {},
			$plant_text;

		if (typeof event === "number") {
			$plant_text = this.$el.find([
										".plant-item",
										event.toString()
									].join("-"))
							  	  .find(".plant-text");
		} else {
			$plant_text = $(event.currentTarget).siblings(".plant-text");
		}	
		result["species"] = $plant_text.find(".id-species-edit").val();
		result["quantity"] = $plant_text.find(".id-quantity-edit").val();
		result["information"] = $plant_text.find(".id-information-edit").val();
		return result;
	},

	// @desc: Direct UI Call after clicking the .add-plant button
	// @params: None
	// @res: Void
	_addPlant: function () {
		this.collection.add({ 
							  species : "Use the name most familiar to you.",
							  quantity : 0,
							  information : [
												"You've added a new plant.",
												" Use this section to tell ",
												"people how they should care",
												" for your plants (i.e. inst",
												"ructions for watering, pruni",
												"ng, fertilizer, etc.)."
											].join(""),
							});
	},

	// @desc: Updates the Profile Header plant count in response to 
	// 		  changes in Plant number
	// @params: None
	// @res: Void
	_updateProfileHeaderPlantCount: function () {
		this.trigger("changeAttribute",
					{plant_num: this.collection.length},
					this.parent.gardener_model.attributes['id']);
	},

	// @desc: Adds Plant View UI, and MVC elements
	// @params: Backbone Model Object, Backbone Collection Object, JS Object
	// @res: Void
	_addPlantView: function (model, collection, opts) {
		var temp_id, default_info;
		default_info = [
							"You've added a new plant.",
							" Use this section to tell ",
							"people how they should care",
							" for your plants (i.e. inst",
							"ructions for watering, pruni",
							"ng, fertilizer, etc.)."
						].join("");
		temp_id = model.cid;
		context = _.clone(model.attributes);
		// If the model is still new
		if (model.isNew()) {
			context['id'] = temp_id;
			// Add to isPlantEditable
			this._initializePlantEditable(context['id'], true);

			// Add to PlantView
			this.$el.find(".plant-header")
					.after(this.template(context));
			this._togglePlantMode(
					this.$el
						.find(".plant-item-" + temp_id)
						.find(".plant-text"),
					"edit",
					true);
		}
		else {
			this._initializePlantEditable(model.attributes["id"]);
			this.$el.find(".plant-header")
					.after(this.template(model.attributes));
		}
		this._updateProfileHeaderPlantCount();
	},

	// @desc: Internal: Get the desired jQuery object using a parent, a 
	// 		  parameter, and a type ("edit" or "display")
	// @params: jQuery Object, String
	// @res: jQuery Object
	_getJQueryElement: function ($parent, type) {
		return $parent.find("." + type);

	},

	// @desc: Toggles the Plant input, accounting for which plant,
	// 		  which input, and which state it is currently in
	// @params: jQuery Object, String, Boolean
	// @res: Void
	_togglePlantMode: function($plant_content, option, isForceToggled) {
		var $display, $input, $icon;

		$icon = $plant_content.siblings(".edit-plant").children(".fa");

		$input = this._getJQueryElement(
											$plant_content,
											"edit-input"
										);
		$display = this._getJQueryElement(
											$plant_content,
											"plant-display"
										);

		if (option === "display") {
			$display.show();
			$input.removeAttr("style");
			$icon.removeClass("fa-check");
			$icon.addClass("fa-pencil");
		} else if (option === "edit") {
			$display.hide();
			$input.css({"display": "block", "clear": "both"});
			// Change icon from checkmark to pencil
			$icon.removeClass("fa-pencil");
			$icon.addClass("fa-check");
		}
		
		if (isForceToggled) {
			this.isPlantEditable[$plant_content.find("input[name='plant-id']").val()] = true;
			$icon.addClass("fa-check");
			$icon.removeClass("fa-pencil");
		}
	},
	

	// @desc: Toggles the Editability of Plant Items
	// @params: Event object
	// @res: Void
	_togglePlantEdit: function (event) {
		var $plant_content,
			_id,
			target_attr,
			$icon,
			obj_to_save,
			callBack;

		// Set $plant_content to the plant panel
		$plant_content = $(event.currentTarget).siblings(".plant-text");

		// Get plant-id from hidden input
		_id = $plant_content.children("input[name='plant-id']").val();
		if (_id.charAt(0) !== "c") {
			_id = parseInt($plant_content.children("input[name='plant-id']").val(), 10);
		}
		
		if (this.isPlantEditable[_id]) {
			// If the plant is already editable, trigger
			// to non-editable display AND SAVE THE PLANT
			obj_to_save = this._jsonifyPlant(event);
			if (this.collection.get(_id).isNew()) {
				callBack = _.bind(function (response) {
							   		var model, model_cid;
							   		$plant_content.find(".edit-input")
							   				.removeClass("error");
							   		$plant_content.find(".error-msg").remove();
							   		model = this.collection.get(_id);
							   		model_cid = model["cid"];
							   		this.$el.find(".plant-item-" + model_cid).remove();
							   		this._addPlantView(model, this.collection);
							   }, this);
			} else {
				callBack = _.bind(function (response) {
									$plant_content.find(".edit-input")
							   				.removeClass("error");
					   				$plant_content.find(".error-msg").remove();
									this._togglePlantMode($plant_content, "display");
								}, this);
			}
			this.collection.get(_id)
						   .save(obj_to_save)
						   .done(callBack)
						   .fail(_.bind(function (response) {
						   		response = JSON.parse(response.responseText);
						   		console.log(response);
						   		var bad_prop;
						   		for (bad_prop in response) {
						   			if (response.hasOwnProperty(bad_prop)) {
						   				$plant_content.find(".id-" + bad_prop + "-edit")
						   						.addClass("error");
						   				$plant_content.find(".id-" + bad_prop + "-edit")
						   						.after("<p class='error-msg'>"+ response[bad_prop][0] +"</p>");
						   			}
						   		}
						   }, this));
		} else {
			// If plant is not yet editable, trigger
			// to input mode
			this._togglePlantMode($plant_content, "edit");
		}
		// Toggle the value from bool(x) to !bool(x).
		this.isPlantEditable[_id] = !this.isPlantEditable[_id];
	},

	// @desc: Sets isPlantEditable to all false
	// @params: Integer (or String)
	// @res: Void
	_initializePlantEditable: function (_id) {
		this.isPlantEditable[_id] = false;
	},

	_changePlant: function (model, collection, opts) {
		var property, changed, trigger_object = {};
		changed = model.changed;
		for (property in changed) {
			if (changed.hasOwnProperty(property)) {
					trigger_object[property] = changed[property];
					this.trigger("changeAttribute", trigger_object, model.attributes['id']);
					trigger_object = {};
			}
		}
	},

	// @desc: Called while initializing ProfilePageView
	// @params: Simple JS Object
	// @res: Void
	initialize: function (attrs) {
		this.parent = attrs['parent'];
		this.collection = attrs['collection'];

		// Iterate across the given collection
		this.collection.each(_.bind(function (model) {
			var _id = model.attributes['id'];
			// Initialize isPlantEditable nested object
			this._initializePlantEditable(_id);
			this.plant_img_views[_id] = new PlantImgView({
											parent: this,
											el: [
												".img-car-wrapper",
												_id.toString()
											].join("-"),
											collection: new PlantImgs(model.attributes['images'], {plant_id: _id})
										});
		}, this));

		// Debounce the toggle methods
		this._togglePlantEdit = _.debounce(_.bind(this._togglePlantEdit, this), 1000, true);

		// Event Listeners
		this.listenTo(this.collection, "add", this._addPlantView);
		this.listenTo(this.collection, "remove", this._removePlantView);
		this.listenTo(this.collection, "change", this._changePlant);
		bv.listenTo(this, "changeAttribute", bv.propagateChanges);
	},

});