var Plants = Backbone.Collection.extend({
	model: Plant,
	urlRoot : "/profile/plant/",
	url: function () {
		return  this.urlRoot;
	},
});