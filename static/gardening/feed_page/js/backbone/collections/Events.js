var Events = Backbone.Collection.extend({
	url: "/events/?page=2",
	parse: function (result) {
		this.url = (result.next ? result.next : this.url);
		return result.results;
	},
});