// Extend Backbone model to create Gardener model class
var Gardener = Backbone.Model.extend({
	urlRoot: "/profile/gardener/",
	url: function () {
		return  [this.urlRoot, this.attributes.id].join('');
	},
});

// Extend Backbone model to create Plants model class
var Plant = Backbone.Model.extend({
	urlRoot : "/profile/plant/",
	url: function () {
		if (this.attributes.id) {
			return  [this.urlRoot, this.attributes.id].join('');
		} else {
			return this.urlRoot;
		}
	},
});

// Extend Backbone model to create PlantImg model class
var PlantImg = Backbone.Model.extend({
	urlRoot: "/profile/plantimg/",
	url: function () {
		return  [this.urlRoot, this.attributes.id].join('');
	},
});