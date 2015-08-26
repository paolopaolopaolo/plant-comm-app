var Jobs = Backbone.Collection.extend({
	url:"/jobs/?page=1",
	model: Job,

	_intervalFetch: function () {
		this.fetch({isSamePage: true})
			.done(setTimeout(_.bind(function () {
				this._intervalFetch();
			}, this), 10000));
	},

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
	initialize: function () {
		this._intervalFetch();	
	},
});