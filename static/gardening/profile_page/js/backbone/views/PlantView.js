var PlantView = Backbone.View.extend({

	el: ".plant-content",
	template: _.template($("#plant-template").html()),

	plant_img_views: {},
	isPlantEditable: {},

	events: {
		"click .edit-plant": "_togglePlantEdit",
		"click .add-plant": "_addPlant",
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
			$plant_text = $(event.currentTarget).parents(".plant-text");
		}	
		result["species"] = $plant_text.find(".id-species-edit").val();
		result["quantity"] = $plant_text.find(".id-quantity-edit").val();
		result["information"] = $plant_text.find(".id-information-edit").val();
		return result
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
			this._initializePlantEditable(context['id']);

			// Add to PlantView
			this.$el.find(".plant-header")
					.after(this.template(context));
		}
	},

	// @desc: Internal: Get the desired jQuery object using a parent, a 
	// 		  parameter, and a type ("edit" or "display")
	// @params: jQuery Object, String, String
	// @res: jQuery Object
	_getJQueryElement: function ($parent, param_string, type) {
		return $parent.find([".id", param_string, type].join("-"));
	},

	// @desc: Toggles the Plant input, accounting for which plant,
	// 		  which input, and which state it is currently in
	// @params: jQuery Object, String, String
	// @res: Void
	_togglePlantMode: function($plant_content, param_string, option) {
		var $display, $input;

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
			$icon,
			obj_to_save;

		// Set $plant_content to the plant panel
		$plant_content = $(event.currentTarget).parents(".plant-text");
		// Get plant-id from hidden input
		_id = $plant_content.children("input[name='plant-id']").val();
		if (_id.charAt(0) !== "c") {
			_id = parseInt($plant_content.children("input[name='plant-id']").val(), 10);
		}
		// Get target parameter from hidden input
		target_attr = $(event.currentTarget).children("input[name='param']").val();
		// Get the icon-to-change
		$icon = $(event.currentTarget).children(".fa");
		
		if (this.isPlantEditable[_id][target_attr]) {
			// If the plant is already editable, trigger
			// to non-editable display AND SAVE THE PLANT
			obj_to_save = this._jsonifyPlant(event);
			this.collection.get(_id)
						   .save(obj_to_save)
						   .done(_.bind(function (response) {
								this._togglePlantMode($plant_content, target_attr, "display");
								// Change icon from checkmark to pencil
								$icon.removeClass("fa-check");
								$icon.addClass("fa-pencil");
						   }, this));
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

	// @desc: Sets isPlantEditable to all false
	// @params: Integer (or String)
	// @res: Void
	_initializePlantEditable: function (_id) {
		this.isPlantEditable[_id] = {};
		this.isPlantEditable[_id]["species"] = false;
		this.isPlantEditable[_id]["quantity"] = false;
		this.isPlantEditable[_id]["information"] = false;
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
												".img-carousel",
												_id.toString()
											].join("-"),
											collection: new PlantImgs(model.attributes['images'], {plant_id: _id})
										});
		}, this));

		// Event Listeners
		this.listenTo(this.collection, "add", this._addPlantView);
		this.listenTo(this.collection, "change", this._changePlant);
		bv.listenTo(this, "changeAttribute", bv.propagateChanges);
	},

});