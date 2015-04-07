var PlantImgs = Backbone.Collection.extend({
	urlRoot: '/profile/plantimg/',
	url: function () {
		return [this.urlRoot, this.id.toString()].join('');
	},
	model: PlantImg,
	initialize: function (attrs, opts) {
		this.id = opts['plant_id'];
		console.log('plant_id:');
		console.log(this.plant_id);
	},
});