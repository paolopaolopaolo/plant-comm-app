// Top level Profile Page View

var ProfilePageView = Backbone.View.extend({

	profile_view: undefined, 
	plant_view: undefined,
	plant_image_views: {},
	el: 'body',


	initialize: function () {
		// Initialize Plant and Gardener/Profile views
		this.plant_view = new PlantView();
		this.profile_view = new ProfileView();
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
			// This is a hack to remove the delete button on entry
			this.plant_view.$el.find('.toggle_plant_edit')
							   .trigger('click')
							   .trigger('click');

		}, this));

		$(window).on('resize', _.throttle(function () {
			$(".plantpic_thumb").removeAttr('style');
		}, 1000));

	},

});

var ppv = new ProfilePageView();