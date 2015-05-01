var OGView = Backbone.View.extend({

	// Variables
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
		'click .contact_gardener': 'openGardenerDialogue',
	},

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

	// This function appends a new view for every
	// new OG model
	_createNewOG: function (model) {
		var context, plants, images, $avail, first_img, profile_pic;

		first_img = true;

		// Set template context with model attributes
		// and set plants to the plants attribute in each model
		context = _.clone(model.attributes);
		plants = context['plants'];

		// Set profile pic to default if there is no URL
		context['profile_pic'] === "" ? context['profile_pic'] = DEFAULT_PROFILE_PIC:
										context['profile_pic'] = this._setProfilePic(context);

		// Add 'avail' as a parameter that evaluates
		// to a string that will be added onto the template 
		context['available'] ? context['avail'] = "": context['avail'] = "NOT";
		
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
			$plants_box.append(this.plant_template(plant['plant']));

			$img_box = $plants_box.find("#plant_img" + plant['plant']['id'].toString());
			images = plant['imgs'];

			// Iterate among the plant's images
			_.each(images, _.bind(function (image) {
				if (first_img) {
					image = this._setImageUrl(image);
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

	_setImageUrl: function (img_obj) {
		var img_to_return;
		img_to_return = _.clone(img_obj);
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
		
		// Set event listeners
		this.listenTo(this.collection, "add", this._createNewOG);
		this.listenTo(this.collection, "change", this.render);
		this.listenTo(this.collection, "remove", this.render);

		// Set refresher to refresh automagically every 5 minutes
		this.REFRESHER = setInterval(_.bind(function () {
			this.fetchGardeners();
		}, this), 300000);
	},
	

});