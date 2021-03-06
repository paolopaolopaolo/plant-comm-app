var Events = Backbone.Collection.extend({
	url: "/events/?page=1",
	parse: function (result) {
		if (result.next) {
			this.url = result.next;
		} else {
			this.trigger("noMoreEvents");
		}
		return result.results;
	},
});