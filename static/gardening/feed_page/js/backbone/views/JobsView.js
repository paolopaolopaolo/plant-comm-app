var JobsView = EventsView.extend({
	el: ".jobs-feed",
	template: _.template($('#job-template').html()),

	initialize: function (attrs) {
		JOBS = _.map(JOBS, function (job) { return JSON.parse(job); });
		this.collection = new Jobs(JOBS);
		this.parent = attrs['parent'];
		this.render();

		this.listenTo(this.collection, "add", this.render)
	},
});