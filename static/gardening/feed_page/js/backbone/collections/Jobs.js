var Jobs = Backbone.Collection.extend({
	url:"/jobs/?page=1",
	model: Job,
	fetch: function (opts) {
		if (opts.isSamePage) {
			this.url = (this.prevURL ? this.prevURL: this.url);
		}
		return Backbone.Collection.prototype.fetch.apply(this, arguments);
	},
	parse: function (result) {
		if (result.next) {
			this.nextURL = result.next
			this.url = result.next;
		} else {
			this.trigger("noMoreJobs");
		}
		this.prevURL = result.prev
		return result.results;
	},
});