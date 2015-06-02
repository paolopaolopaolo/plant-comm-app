var OGView = Backbone.View.extend({

	// Variables
	REFRESHER: undefined,
	REFRESH_HOLD: undefined,

	// Target element
	el: '#og_content',
	current_page: 2,

	// Templates
	template: _.template($('#other_gardener_template').html()),
	plant_template: _.template($('#other_gardener_plant_template').html()),
	img_template: _.template($('#plant_image_template').html()),

	// UI Events
	events: {
		'click #refreshGardeners': 'fetchGardeners',
		'mouseover .plantimg_sprites:not(.first_plant_img)': 'changeTopImage',
		'click .contact_gardener': 'openGardenerDialogue',
	},

	// A throttled trigger debouncer (keeps crazy people from accidentally)
	// opening 500000 of the same dialogue window
	_throttledTrigger : _.debounce(function (event, arg) {
		this.trigger(event, arg);
	}, 1000, true),

	// Trigger an open dialogue, passing through
	// the id of the target user 
	openGardenerDialogue: function (event) {
		var target_id, throttled_trig;
		target_id = $(event.currentTarget).attr('id');
		target_id = target_id.replace(/contact__/g, "");
		target_id = parseInt(target_id, 10);

		// throttled_trig = _.debounce(_.bind(function () {
		// 		this.trigger("openNewDialogue", target_id);
		// }, this), 3000, true);

		this._throttledTrigger("openNewDialogue", target_id);
	},

	// Simple function that changes the src of the top image 
	changeTopImage: function (event) {
		var $originalTarget, $currentTarget;
		$currentTarget = $(event.currentTarget);
		$originalTarget = $currentTarget.parent()
										.children(".first_plant_img");
		if ($originalTarget.attr('src') !== $currentTarget.attr('src')) {
			$originalTarget.attr('src', $currentTarget.attr('src'));
		}
	},

	// Simply, it fetches the OG Collection from the server
	fetchGardeners: function () {
		this.collection.fetch();
	},

	// This function resets the HTML of the page to the initial HTML
	// and then recreates everything using _creatNewOG
	render: function () {
		var initialHTML;
		initialHTML = [
						"<h1><strong>Gardeners</strong></h1>",
						"<span id='refreshGardeners'>",
						"<i class='fa fa-refresh'></i>",
						"</span>"
					  ].join("");
		this.$el.html(initialHTML);
		this.collection.each(_.bind(function (model) {
			this._createNewOG(model);
		}, this));
		return this
	},

	// Takes an OG context and sets the url appropriately
	_setProfilePic: function (context) {
		var profile_pic_url;

		if (context['profile_pic'].indexOf('http') < 0) {
			profile_pic_url = [
					window.location.protocol,
					"//",
					window.location.hostname,
					(window.location.port ? ":" + window.location.port: ""),
					"/media/",
					context['profile_pic']
			].join("");
		} else {
			profile_pic_url = context['profile_pic'];
		}
		return profile_pic_url;
	},

	// Setting profile_pic, avail, and online in context
	__contextFixes: function (context) {
		// Set profile pic to default if there is no URL
		context['profile_pic'] === "" ? context['profile_pic'] = DEFAULT_PROFILE_PIC:
										context['profile_pic'] = this._setProfilePic(context);

		// Add 'avail' as a parameter that evaluates
		// to a string that will be added onto the template 
		context['available'] ? context['avail'] = "": context['avail'] = "NOT";

		// Set 'online' status
		context['online'] ? context['online'] = "<span style='color:green'>ONLINE</span>" :
							context['online'] = "<span style='color:red'>OFFLINE</span>";
		return context;
	},

	// Using content['avail'] to add classes to jQuery objs 
	__setAvailState: function (context) {
		var $avail;

		// Set $avail to be the span that color codes whether or not
		// a person is available for gardening
		$avail = this.$el.find("#gardener_box" + context['id'].toString())
						 .find("span.availability");

		// Remove both pre-existing color classes
		$avail.removeClass("positive");
		$avail.removeClass("negative");

		// Add the appropriate color class based on whether or not
		// a user is "available"
		context['available'] ? $avail.addClass("positive") : $avail.addClass("negative");
	},

	// Fix plant information (if user hasn't fully updated plants ie species
	// and information for the plant are still the default start messages
	__fixPlantDescription: function (context) {
		var result_context, DEFAULT_SPECIES, DEFAULT_DESCRIPTION;

		result_context = _.clone(context);
		DEFAULT_SPECIES = "Use the name most familiar to you.";
		DEFAULT_DESCRIPTION = [
									"You've added a new plant. ",
									"Use this section to tell people",
									" how they should care for your plants ",
									"(i.e. instructions for watering, pruning,",
									" fertilizer, etc.)."
							  ].join("");

		result_context['species'] = (context['species'] === DEFAULT_SPECIES ? 
									"Unknown": context['species']);
		result_context['information'] = (context['information'] === DEFAULT_DESCRIPTION ? 
										"Pending...": context['information']); 
		return result_context;
	},


	// This function appends a new view for every
	// new OG model
	_createNewOG: function (model) {
		var context, plants, first_img;

		first_img = true;

		// Set template context with model attributes
		// and set plants to the plants attribute in each model
		context = _.clone(model.attributes);
		plants = context['plants'];

		context = this.__contextFixes(context);
		
		// Append to the view the templated context
		this.$el.append(this.template(context));

		this.__setAvailState(context);

		// Iterate among the user's plants
		_.each(plants, _.bind(function (plant) {
			var $plants_box, $img_box, images, plant_context;

			// Get images for each plant
			images = plant['imgs'];
			
			// Set jQuery target for the appropriate plant and plantimg boxes
			$plants_box = $(["#og-plants", context['id'].toString()].join(""));
			
			plant_context = this.__fixPlantDescription(plant['plant']);

			// Append to plant target the plant template
			$plants_box.append(this.plant_template(plant_context));
			
			$img_box = $plants_box.find("#plant_img" + plant['plant']['id'].toString());

			// Iterate among the plant's images
			_.each(images, _.bind(function (image) {
				// Run each image through a filter that will 
				// return an image with an adjusted imageURL
				image = this._setImageUrl(image);
				// Have the first image be added twice
				if (first_img) {
					$img_box.append(this.img_template(image));
					$img_box.children('.plantimg_sprites:first-child')
							.addClass('first_plant_img');
					first_img = false;
				}
				$img_box.append(this.img_template(image));
			}, this));
			first_img = true;
		}, this));
	},

	// Helper function that takes an image object
	// and adjusts the imageURL attribute, depending
	// on whether the current imageURL is already
	// a hyperlink or not
	_setImageUrl: function (img_obj) {
		var img_to_return;
		img_to_return = _.clone(img_obj);
		
		// If imageURL is not a hyperlink, assume
		// a local environment and piece together
		// the local mediafiles URL 
		if (img_to_return['imageURL'].indexOf("http") < 0) {
			img_to_return['imageURL'] = [
				window.location.protocol,
				"//",
				window.location.hostname,
				(window.location.port ? ":" + window.location.port: ""),
				"/media/",
				img_to_return['imageURL']
			].join("");
		} 
		return img_to_return;
	},

	_handleBottomScroll: function () {
		var last_page;
		// This is a workaround; if I use 'fetch'
		// then the collection will get corrupted with 
		// the pagination XHR object (which includes
		// attributes like 'count', 'next', and 'prev')
		$.ajax({
			method: 'GET',
			url: [
					'/feed/gardener?page',
					this.current_page.toString()
				 ].join("="),
		}).done(_.bind(function (response) {
			last_page = response;
			this.collection.set(response.results, {remove: false});
			if (last_page.next !== null) {
				this.current_page++;
			}
		}, this));

	},

	initialize: function (attrs, opts) {
		'use strict';

		// Set parent attr to FeedPageView
		this.parent = attrs['parent'];

		// Initialize collecton
		this.collection = new OtherGardeners(OTHER_GARDENERS);
		
		// For each model in collection, append the template
		// to the parent element
		this.collection.each(_.bind(function (model) {
			this._createNewOG(model);
		} ,this));
		
		// Set event listeners on the collection
		this.listenTo(this.collection, "add", this._createNewOG);
		this.listenTo(this.collection, "change", this.render);
		this.listenTo(this.collection, "remove", this.render);

		// Set event listener on parent view
		this.listenTo(this.parent, "scrolledToBottom", this._handleBottomScroll);

		// Set refresher to refresh automagically every 5 minutes
		this.REFRESHER = setInterval(_.bind(function () {
			this.fetchGardeners();
		}, this), 300000);
	},
	

});