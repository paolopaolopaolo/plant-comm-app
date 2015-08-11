var JobsView = EventsView.extend({
	el: '.jobs-feed',
	template: _.template($('#job-template').html()),
	comment_template: _.template($('#comment-template').html()),
	comment_counts: {},

	// @desc: UI response; save the Job model
	// @params: Event object
	// @res: Void
	_addComment: function (event) {
		var text, new_comment, _id, prev_comments, targ_model;
		_id = $(event.currentTarget).parents('.event-panel')
									.find('input[name="job-id"]')
									.val();
		text = $(event.currentTarget).siblings('.comment-post').val();
		$(event.currentTarget).siblings('.comment-post').val('');

		new_comment = {
			text: text
		};

		targ_model = this.collection.get(_id);
		prev_comments = targ_model.attributes['comment'];
		prev_comments.push(new_comment);
		this.comment_counts[parseInt(_id, 10)] = prev_comments.length - 1;
		targ_model.set('comment', prev_comments);
		targ_model.save({patch: true});
	},

	// @desc: Controller Logic 
	// @params: Backbone Model object, Backbone Collection object
	// @res: Void
	_commentRender: function (model, collection) {
		var context = _.clone(model.attributes), $target;

		if (this.comment_counts[model.attributes.id] === undefined) {
			this.comment_counts[model.attributes.id] = model.attributes.comment.length;
		}

		if (this.comment_counts[model.attributes.id] < model.attributes.comment.length ) {

			$target = (this.$el.find('.c-p' + context['id'])
							   .find('.comment-text').length < 1 ?
							   this.$el.find('.c-p'+context['id'])
							  		   .find('input[name="job-id"]'):
							   this.$el.find('.c-p'+context['id'])
							   		   .find('.comment-text')
							   		   .last());
			
			context = this.parent._fixContext(context);
			context = context['comment'][context['comment'].length - 1];
			$target.after(this.comment_template(context));
			this.comment_counts[model.attributes.id] = model.attributes['comment'].length;
		}
	},

	_jobsRender: function (model, collection) {
		this.render_opts['initial'] = false;
		this.render(model, collection, this.render_opts);
	},

	render_opts: {
		'header': '.wall-header',
		'initial': true,
	},

	initialize: function (attrs) {
		var opts;
		JOBS = _.map(JOBS, function (job) { return JSON.parse(job); });
		this.collection = new Jobs(JOBS);
		this.parent = attrs['parent'];
		this.render(undefined, undefined, this.render_opts);
		this.events['click .comment-post-submit'] = this._addComment;

		this.listenTo(this.collection, 'add', this._jobsRender);
		this.listenTo(this.collection, 'change:comment', this._commentRender);
	},
});