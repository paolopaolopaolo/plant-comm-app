		// View for the plants
var PlantView = Backbone.View.extend({
	// Target element is the entire plant panel
	FORM_TOGGLE: {},

	el: ".plant_content_actuel",

	template: _.template($('#plant_form_template').html()),


	// These events will affect composition of this.collection
	events: {
		"click .toggle_plant_edit": "toggleEditable",
		"click #add_plant": "addPlant",
		"click .deletePlant": "deletePlant",
		"change input[type='text'], input[type='number']": "savePlant",
		"change textarea": "savePlant",
	},

	getID: function ($input_target) {
		"use strict";
		var $targ_form, current_id;
		$targ_form = $($input_target.parents('.plant_form')[0]);
		current_id = $targ_form.find("input[name='plant_id']").val();
		return current_id;
	},

	// add plant to collection
	addPlant: function (event) {
		"use strict";
		var new_plant;

		new_plant = new Plant({
			'information': ['You\'ve added a new plant. Use this section',
			                ' to tell people how they shouldcare for your',
			                ' plants (i.e. instructions for watering,',
			                ' pruning, fertilizer, etc.).'].join(""),
			'quantity': 0,
			'species': 'Use the name most familiar to you.'
		});
		this.collection.add(new_plant);
	},

	deletePlant: function (event) {
		"use strict";
		var plant_to_remove, confirmation;

		confirmation = confirm('Delete plant?');
		if (confirmation) {
			plant_to_remove = this.getID($(event.currentTarget));
			this.collection.remove(plant_to_remove);
		}
	},

	savePlant: function (event) {
		"use strict";
		var _id, plant_to_change, input_name, input_value, input = {};

		_id = this.getID($(event.currentTarget));
		console.log('savePlant (_id):');
		console.log(_id);

		input_name = $(event.currentTarget).attr('name');
		if (input_name !== 'available') {
			input_value = $(event.currentTarget).val();
		} else {
			input_value = $(event.currentTarget).prop('checked');
		}
		input[input_name] = input_value;

		plant_to_change = this.collection.get(_id);
		plant_to_change.set(input);
	},

	// Makes text inputs readonly or editable, depending on FORM_TOGGLE value
	toggleEditable: function (event) {
		"use strict";
		var $targetForm, current_id;
		// get the target panel
		$targetForm = $(event.currentTarget).parent();
		// Obtain the current id
		current_id = this.getID($(event.currentTarget));
 		this.FORM_TOGGLE[current_id] = !this.FORM_TOGGLE[current_id];
 		if (!this.FORM_TOGGLE[current_id]) {
  			this.editConditions(current_id, $targetForm);
  			// clearInterval(this.refresh_form);
 		} else {
 			this.initialConditions(current_id);
 			// this.refreshFormInterval();
 		}
	},

	// EDIT conditions. Triggered when FORM_TOGGLE is true
	editConditions: function (current_id, $targform) {
		"use strict";
		var $targetForm;

		if ($targform === undefined) {
			$targetForm = $('#plant_form' + current_id.toString());
		} else {
			$targetForm = $targform;
		}

		$targetForm.find('input[type="text"], input[type="number"], textarea')
  					   .removeAttr('readonly')
  					   .removeAttr('disabled')
  					   .removeAttr('style');
		$targetForm.find('.toggle_plant_edit').html('Save Plant');
		$targetForm.find('.deletePlant').removeClass('hidden');
		$targetForm.find('.fake_button').removeClass('hidden');
		if ($targetForm.find('.plantpic_thumb').length > 0) {
			$targetForm.find('.delete_img').removeClass('hidden');
		}
	},

	// // Initial conditions. Triggered when FORM_TOGGLE is false
	initialConditions: function (current_id) {
		"use strict";
		var $current_form;
		$current_form = this.$el.find('#plant_form' + current_id.toString());

		$current_form.find('input[type="text"], input[type="number"], textarea')
					 .css({
						'background-color':'transparent',
						'border': 'none'
						})
					 .attr({
						'readonly': 'readonly',
						'disabled': 'disabled'
					 });
		$current_form.find('.toggle_plant_edit').html('Edit Plant');
		$current_form.find('input[type="file"]').addClass('hidden');
		$current_form.find('.deletePlant').addClass('hidden');
		$current_form.find('.fake_button').addClass('hidden');
		$current_form.find('.delete_img').addClass('hidden');
	},

	// This refreshes everything after 10 seconds 
	refreshFormInterval: function () {
		"use strict";
		this.refresh_form = setInterval(_.bind(function () {
							console.log('plant view fetch');
							this.collection.fetch();
						   }, this), 5000);
	},

	
	// Saves the model in response to changes
	changePlant: function (model) {
		"use strict";
		var _id = model.attributes['id'],
			changed = model.changed,
			property;

		model.save(changed)
			 .done(_.bind(function () {
			 				var $targetform;
			 				$targetform = this.$el.find('#plant_form' + _id.toString());
			 				for (property in changed) {
			 					if (changed.hasOwnProperty([property])) {
			 						if (property === 'information') {
					 					$targetform.find('textarea[name="' + property + '"]')
					 							   .val(changed[property]);
			 						}
				 					$targetform.find('input[name="' + property + '"]')
				 							   .val(changed[property]);
				 					}
			 				}
			 			}, this));
	},

	// Saves the model in response to adding the model to collection
	newPlant: function (model) {
		"use strict";
		var context, _id;
		context = model.attributes;
		model.save(context)
			 .done(_.bind(function (response) {
			 			context['id'] = response['id'];
						this.$el.find("#add_plant")
								.after(this.template(context));
						this.FORM_TOGGLE[context['id']] = false;
						_id = context['id'];
						ppv.plant_image_views[_id] = new PlantImgView({
											collection: new PlantImgs([], {'plant_id': _id}),
											plant_id: _id,
											el: ["#twp", _id.toString()].join('')});
						ppv.plant_image_views[_id].toggleArrowDisplay();
						this.editConditions(context['id']);
			 }, this));

	},

	// Destroys the model in response to removing the model from collection
	plantDestroy: function (model) {
		"use strict";
		model.destroy()
			 .complete(function () {
			 	$('#plant_form' + model.attributes['id'].toString()).detach();
			 	ppv.plant_image_views[model.attributes['id']].remove();
			 });
	},

	initialize: function () {
		"use strict";
		// Hide Templates
		$(".plant_form").hide();
		$('#plantpic_thumb_template').hide();
		// Get and set the collection with cached data
		this.collection = new Plants(PLANT_SOURCE);

		// Set event listener to listen to changes in the collection
		this.listenTo(this.collection, "change", this.changePlant);
		this.listenTo(this.collection, "add", this.newPlant);
		this.listenTo(this.collection, "remove", this.plantDestroy);

		// Render all the plants
		this.render();

		// Refresh form interval start
		this.refreshFormInterval();
	},

	// Render function, iterates through collection and
	// appends everything to the site
	render: function () {
		"use strict";
		this.collection.each(_.bind(function (model) {
			var _id, context;
			context = model.attributes;
			_id = context['id'];
			this.FORM_TOGGLE[_id] = true;
			this.$el.find('#add_plant')
					.after(this.template(context));
			this.initialConditions(_id);
		}, this));
		return this;
	},


});
