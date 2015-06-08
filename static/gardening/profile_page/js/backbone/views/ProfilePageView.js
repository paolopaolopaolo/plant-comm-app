var ProfilePageView = Backbone.View.extend({

	el: ".profile-page",

	_initializePlantCarousel: function () {
		this.$el.find(".img-carousel").slick({
			accessibility: true,
			infinite: true,
			adaptiveHeight: true,
		});
	},

	initialize: function (gardener, plants) {
		this.gardener_model = new Gardener(gardener);
		this.plants_collection = new Plants(plants);
		this._initializePlantCarousel();
	},


});

bv.profile_view = new ProfilePageView(GARDENER, PLANTS);