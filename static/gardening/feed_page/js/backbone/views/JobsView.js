var JobsView = Backbone.View.extend({
	el: ".jobs-feed",
	initialize: function (attrs) {
		JOBS = _.map(JOBS, function (job) { JSON.parse(job); });
		this.collection = new Jobs(JOBS);
		this.parent = attrs['parent'];
	},
});