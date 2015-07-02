var PlantImgView = Backbone.View.extend({
	
	// @desc: Initialize a Slick Image Carousel for the plant images
	// @params: None
	// @res: Void
	_initializePlantCarousel: function () {
		this.$el.slick({
			accessibility: true,
			infinite: true,
			adaptiveHeight: true,
			variableWidth: true,
		});
	},

	initialize: function (attrs) {
		this.parent = attrs['parent'];
		this.el = attrs['el'];
		this.collection = attrs['collection'];
		this._initializePlantCarousel();
	}
});