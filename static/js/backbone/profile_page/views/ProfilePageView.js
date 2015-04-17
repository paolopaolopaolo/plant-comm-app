// Top level Profile Page View

var ProfilePageView = Backbone.View.extend({

	TOGGLE_MENU: true,
	MENU_INITIAL_HEIGHT: 0,
	profile_view: undefined, 
	plant_view: undefined,
	plant_image_views: {},
	el: 'body',
	events: {
		'mouseenter #menu-wrapper' : 'toggleMenu',
		'mouseleave #menu-wrapper' : 'toggleMenu',
		'focus #menu-wrapper' : 'toggleMenu',
		'blur #menu-wrapper' : 'toggleMenu',
	},

	// Toggles the menu height
	toggleMenu: function (event) {
		var hgt_str;
		hgt_str = [this.MENU_INITIAL_HEIGHT.toString(), "px"].join("");

		if (this.TOGGLE_MENU) {
			$('#menu-button').unbind();
			this.$el
				.find('#top-bar-menu')
				.animate({'height': hgt_str});
		} else {
			this.$el
				.find('#top-bar-menu')
				.animate({'height': "0px"});

		}
		this.TOGGLE_MENU = !this.TOGGLE_MENU;

	},

	// Initializes menu conditions by storing the initial menu height 
	// and then re-sizing the menu height to 0px 
	_initializeMenuButton: function () {
		this.MENU_INITIAL_HEIGHT = parseInt(this.$el
												.find('#top-bar-menu')
												.css('height')
												.replace(/px/g, ""),
											10);
		$('#top-bar-menu').css('height', '0px');
	},

	initialize: function () {
		// Initialize Plant and Gardener/Profile views
		this.plant_view = new PlantView({parent_view: this});
		this.profile_view = new ProfileView({parent_view: this});
		// Initialize Plant Img Views for each collection of images
		_.each(PLANT_IMG_SOURCE, _.bind(function (img_obj) {
			var _id = img_obj['id'],
				images = img_obj['images'];

			// Creates an object of plant_img_views, linking each view to each plant
			this.plant_image_views[_id] = new PlantImgView({
					collection: new PlantImgs(images, {'plant_id': _id}),
					plant_id: _id,
					el: ["#twp", _id.toString()].join('')
			});
		}, this));

		// Removes style attributes on plant thumbnail pictures 
		// whenever the window is resized.
		$(window).on('resize', _.throttle(function () {
			$(".plantpic_thumb").removeAttr('style');
		}, 1000));

		this._initializeMenuButton();
	},

});

var ppv = new ProfilePageView();