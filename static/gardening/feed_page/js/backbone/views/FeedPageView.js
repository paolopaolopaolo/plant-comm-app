var FeedPageView = Backbone.View.extend({
	"el": "body",

	events: {
		"click .job-post-submit": "_submitJob",
	},

	// @desc: Adds Job to Collection
	// @params: 
	_submitJob: function (event) {
		var $text_input, model_job;
		$text_input = $(event.currentTarget).siblings(".job-post");
		model_job = new Job({
			text_description: $text_input.val(),
		});

		model_job.save(model_job.attributes)
			 	 .done(_.bind(function (response) {
			 	 	model_job["comment"] = [];
					this.jobs_view.collection.add(model_job);
			 	 }, this))
			 	 .fail(_.bind(function (response) {
			 		console.log(response);
			 	 }, this));
	},

	// @desc: Controller Logic (revise the context)
	// @params: JS Object (context)
	// @res: JS Object (revised context)
	_fixContext: function (context) {
		// Reset profile_pic
		context["user"]["profile_pic"] = this.parent.setMediaPic(context["user"], "profile_pic");
		// Plant Image Fix
		if (context["plant_img"]) {
			context["plant_img"]["image"] = this.parent.setMediaPic(context["plant_img"], "image");
		}
		if (!context["comment"]) {
			context["comment"] = [];
		}
		return context;
	},

	initialize: function (attrs) {
		this.parent = attrs['parent'];
		this.jobs_view = new JobsView({parent: this});
		this.events_view = new EventsView({parent: this});

	},
});

bv.feed_page = new FeedPageView({parent: bv});