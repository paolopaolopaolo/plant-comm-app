var PlantImgView = Backbone.View.extend({
	

	events: {
		"click add-plant-img": "_addImage",
		"click rem-plant-img": "_removeImage",
	},

	// @desc: Initialize a Slick Image Carousel for the plant images
	// @params: None
	// @res: Void
	_initializePlantCarousel: function () {
		this.$el.find(".img-carousel").slick({
			accessibility: true,
			infinite: true,
			adaptiveHeight: true,
			variableWidth: true,
		});
	},

	// @desc: Renders all images in the collection
	// @params: None
	// @res: Void
	render: function () {
		this.collection.each(_.bind(function (model) {
			this._addImageUI(model.attributes);
		}));
	},

	initialize: function (attrs) {
		this.parent = attrs['parent'];
		this.el = attrs['el'];
		this.collection = attrs['collection'];
		this.render();
		this._initializePlantCarousel();
	}
});