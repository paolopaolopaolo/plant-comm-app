var FeedPageView = Backbone.View.extend({
	"el": "body",

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
		return context;
	},

	initialize: function (attrs) {
		this.parent = attrs['parent'];
		this.jobs_view = new JobsView({parent: this});
		this.events_view = new EventsView({parent: this});

	},
});

bv.feed_page = new FeedPageView({parent: bv});