var OGView = Backbone.View.extend({

	// Variables
	STARTUP: true,
	REFRESHER: undefined,
	REFRESH_HOLD: undefined,

	// Target element
	el: '#og_content',

	// Templates
	template: _.template($('#other_gardener_template').html()),
	plant_template: _.template($('#other_gardener_plant_template').html()),
	img_template: _.template($('#plant_image_template').html()),

	// UI Events
	events: {
		'click #refreshGardeners': 'fetchGardeners',
		'mouseover .plantimg_sprites:not(.first_plant_img)': 'changeTopImage',
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

	// This function appends a new view for every
	// new OG model
	_createNewOG: function (model) {
		var context, plants, images, $avail, first_img;

		first_img = true;

		// Set template context with model attributes
		// and set plants to the plants attribute in each model
		context = _.clone(model.attributes);
		plants = context['plants'];

		// Add 'avail' as a parameter that evaluates
		// to a string that will be added onto the template 
		context['available'] ? context['avail'] = "": context['avail'] = "NOT";

		// Adjust profilepic src
		if(!/http[s]+:\/\//.test(context['profile_pic']) && !this.STARTUP) {
			 context['profile_pic'] = [	
										DOMAIN,
										"media/",
										context['profile_pic'] 
									  ].join("");
		}
		// Append to the view the templated context
		this.$el.append(this.template(context));

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

		// Iterate among the user's plants
		_.each(plants, _.bind(function (plant) {
			var $plants_box, $img_box, images;

			$plants_box = $(["#og-plants", context['id'].toString()].join(""));
			console.log("$plants_box:");
			console.log($plants_box);
			$plants_box.append(this.plant_template(plant['plant']));

			$img_box = $plants_box.find("#plant_img" + plant['plant']['id'].toString());
			console.log("$img_box");
			console.log($img_box);
			images = plant['imgs'];

			// Iterate among the plant's images
			_.each(images, _.bind(function (image) {
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

	initialize: function (attrs, opts) {
		'use strict';

		// Initialize collecton
		this.collection = new OtherGardeners(OTHER_GARDENERS);
		
		// For each model in collection, append the template
		// to the parent element
		this.collection.each(_.bind(function (model) {
			this._createNewOG(model);
		} ,this));
		this.STARTUP = false;
		
		// Set event listeners
		this.listenTo(this.collection, "add", this._createNewOG);
		this.listenTo(this.collection, "change", this.render);
		this.listenTo(this.collection, "remove", this.render);

		// Set refresher to refresh automagically every 5 minutes
		this.REFRESHER = setInterval(function () {
			this.fetchGardeners();
		}, 300000);
	},
	

});