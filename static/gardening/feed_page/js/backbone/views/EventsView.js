var EventsView = Backbone.View.extend({
	el: ".events-feed",
	template: _.template($("#event-template").html()),
	
	events: {
		"click .more-events": "_fetchMoreEvents",
	},

	// @desc: Method that fetches more events
	// @params: Event Object
	// @res: Void
	_fetchMoreEvents: function (event) {
		var $icon;
		$icon = $(event.currentTarget).find('.fa');
		$icon.addClass('fa-spin');
		this.collection.fetch({remove: false})
					   .always(function () {
					   		$icon.removeClass('fa-spin');
					   });
	},


	// @desc: Helper function that renders a template off a model
	// @params: Backbone Model Object, JS Obj
	// @res: Void
	_render: function (model, opts) {
		var context, $after_target, header_str;
		context = _.clone(model.attributes);
		context = this.parent._fixContext(context);
		header_str = (opts === undefined ? ".events-header": opts['header']);
		if (opts) {
			if (opts.initial) {
				$after_target = (this.$el.find(".event-panel").length > 0 ? 
										this.$el.find(".event-panel").last():
										this.$el.find(header_str));
			} else {
				$after_target = this.$el.find(header_str);
			}
		} else {
			$after_target = this.$el.find(header_str);
		}
		
		$after_target.after(this.template(context));
		
	},

	// @desc: Renders each model
	// @params: Backbone Model Object, Backbone Collection Object, JS Object OR None
	// @res: Void
	render: function (model, collection, options) {
		var context, latest_model;
		if (model === undefined || collection === undefined) {
			this.collection.each(_.bind(function (model) {
				this._render(model, options);
			}, this));
		} else {
			this._render(model, options);
		}
		this.$el.find(".no-event").remove();
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