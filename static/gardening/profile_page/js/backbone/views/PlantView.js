var PlantView = Backbone.View.extend({

	el: ".plant-content",
	template: _.template($("#plant-template").html()),

	// MOVE TO PLANT VIEW
	isPlantEditable: {},

	events: {
		"click .edit-plant": "_togglePlantEdit",
		"click .add-plant": "_addPlant",
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

	initialize: function (attrs) {
		this.parent = attrs['parent'];
		this.collection = attrs['collection'];
		this.collection.each(_.bind(function (model) {
			this.isPlantEditable[model.attributes['id']] = {};
			this.isPlantEditable[model.attributes['id']]["species"] = false;
			this.isPlantEditable[model.attributes['id']]["quantity"] = false;
			this.isPlantEditable[model.attributes['id']]["information"] = false;
		}, this));
	},

});