var JobsView = EventsView.extend({
	el: ".jobs-feed",
	template: _.template($('#job-template').html()),
	comment_template: _.template($('#comment-template').html()),

/*
	_createCommentView: function (model) {
		var _id = model.attributes['id'];
			this.comments_views[_id] = new CommentsView({
				collection: model.attributes['comment'],
				el: ".c-p" + _id,
				parent: this;
			});
	},
*/

	_addComment: function (event) {
		var text, new_comment, _id, prev_comments, targ_model;
		_id = $(event.currentTarget).parents('.event-panel')
									.find('input[name="job-id"]')
									.val();
		text = $(event.currentTarget).siblings(".comment-post").val();
		new_comment = {
			text: text
		};
		targ_model = this.collection.get(_id);
		prev_comments = targ_model.get('comment');
		prev_comments.push(new_comment);
		targ_model.set('comment', prev_comments);
		targ_model.save({patch: true});
	},

	// @desc: Controller Logic 
	_commentRender: function (model, collection) {
		alert("new comment!");
	},

	initialize: function (attrs) {
		JOBS = _.map(JOBS, function (job) { return JSON.parse(job); });
		this.collection = new Jobs(JOBS);
		this.parent = attrs['parent'];
		this.render();

		this.events['click .comment-post-submit'] = this._addComment;

		this.listenTo(this.collection, "add", this.render);
		this.listenTo(this.collection, "change:comment", this._commentRender);
	},
});