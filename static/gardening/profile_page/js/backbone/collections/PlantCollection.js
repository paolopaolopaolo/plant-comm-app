var Plants = Backbone.Collection.extend({
	model: Plant,
	urlRoot : "/profile/plant/",
	url: function () {
		return  this.urlRoot + this.user;
	},
	initialize: function (attrs, opts) {
		if (opts) {
			this.user = opts["user"].toString();
		} else {
			this.user = "";
		}
	},
});