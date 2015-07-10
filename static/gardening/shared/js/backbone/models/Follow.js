var Follow = Backbone.Model.extend({
	urlRoot: "/follow",
	url: function () {
		return this.urlRoot + "/" + this.attributes['id']
	},
});