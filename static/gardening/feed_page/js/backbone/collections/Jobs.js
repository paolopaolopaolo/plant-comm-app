var Jobs = Backbone.Collection.extend({
	url:"/jobs/?page=1",
	model: Job,
	parse: function (result) {
		if (result.next) {
			this.url = result.next;
		} else {
			this.trigger("noMoreJobs");
		}
		return result.results;
	},
});