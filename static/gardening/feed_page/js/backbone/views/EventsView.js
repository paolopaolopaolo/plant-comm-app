var EventsView = Backbone.View.extend({
	el: ".events-feed",
	template: _.template($("#event-template").html()),
	
	events: {
		"click .more-events": "_fetchMoreEvents",
	},

	_fetchMoreEvents: function () {
		this.collection.fetch({remove: false});
	},

	// @desc: Controller Logic (revise the context)
	// @params: JS Object (context)
	// @res: JS Object (revised context)
	_fixContext: function (context) {
		// Reset profile_pic
		debugger
		context["user"]["profile_pic"] = this.parent.setMediaPic(context["user"], "profile_pic");
		if (context["plant_img"]) {
			context["plant_img"]["image"] = this.parent.setMediaPic(context["plant_img"], "image");
		}
		return context;
	},

	// @desc: Helper function that renders a template off a model
	// @params: Backbone Model Object, Boolean
	// @res: Void
	_render: function (model, belongsBefore) {
		var context, $after_target;
		context = _.clone(model.attributes);
		context = this._fixContext(context);

		$after_target = (this.$el
							 .find(".event-panel").length < 1  || belongsBefore ? 
							 this.$el.find(".feed-header") : 
							 this.$el.find(".event-panel").last()
						);
		
		$after_target.after(this.template(context));
		
	},

	// @desc: Renders each model
	// @params: Backbone Model Object, Backbone Collection Object, OR None
	// @res: Void
	render: function (model, collection) {
		var context, latest_model;
		console.log(model);
		if (model === undefined || collection === undefined) {
			this.collection.each(_.bind(function (model) {
				this._render(model);
			}, this));
		} else {
			this._render(model);
		}
	},

	// @desc: Initialize EventsView 
	// @params: JS Object
	// @res: Void
	initialize: function (attrs) {
		// @HACK: Bootstrapped EVENTS are all parsed
		EVENTS = _.map(EVENTS, function (ev) { return JSON.parse(ev); });
		this.collection = new Events(EVENTS);
		this.parent = attrs["parent"];
		this.render();

		this.listenTo(this.collection, "add", this.render);

	},

});

// Have event_view report directly to the BaseView
bv.event_view = new EventsView({parent: bv});