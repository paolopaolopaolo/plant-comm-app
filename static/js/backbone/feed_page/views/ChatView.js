// The view for the Chat Menu

var ChatView = Backbone.View.extend({

	el: "#chat_window",
	template: _.template($("#chat_window_template").html()),

	end_poll: false,

	_scrollToEnd: function () {
		this.$el.removeAttr('style');
		this.$el
			.prop({
						scrollTop: this.$el.prop('scrollHeight')
				  });
	},

	// Closes Event Listeners for this ChatView
	closeChatbox: function () {
		this.$el.css({"padding": "0px"});
		this.stopListening(this.model_target, "change:text");
		this.stopListening(this, 'pressEnter');
		this.$el.children().detach();
	},

	// Opens Event Listeners for the Chatview
	openChatbox: function () {
		this.listenTo(this.model_target, "change:text", this.render);
		this.listenTo(this, "pressEnter", this._submitMessage);
		this.render();
	},

	// Set event listener on target element that triggers 'pressEnter'
	_setSubmitEvents: function () {
		// Enables pressing enter to submit
		this.$el.on("keydown", "input[name='user_chat_line']", _.bind(function (event) {
			if (event.which === 13) {
				this.trigger("pressEnter");
			}
		}, this));
	},

	// Submits a message using Backbone.save()
	_submitMessage: function () {
		var text_to_save;
		text_to_save = [
			this.model_target.attributes['text'],
			USER + ": " +
			this.$el.find('input[name="user_chat_line"]').val()
		].join("{{switch_user}}");
		
		this.model_target.save({
			'text': text_to_save,
		});
	},

	_alertTimeChange: function () {
		alert(this.model_target.attributes['time_initiated']);
	},

	// Initializes Long Polling
	// _startLongPoll: function () {
	// 	// Fetch for the model and then re-call the function
	// 	// once you get a return from the server
	// 	this.model_target.fetch()
	// 					 .always(_.bind(function () {
	// 					 		this._startLongPoll();
	// 					 }, this));
	// },

	_reformatTextline: function (textline) {
		var line_components, result = "";
		line_components = textline.split(':');
		_.each(line_components, _.bind(function (line_component, idx) {
			var join_element = ": ";
			line_component = _.escape(line_component);
			if (idx === 0) {
				line_component = [
					"<b>",
					line_component,
					"</b>"
				].join("");
				join_element = "";
			} 
			result = [
				result,
				line_component
			].join(join_element);
		}, this));
		return result;
	},

	// Renders changes to the chat window
	render: function () {
		var context, textlines;
		// Copy the current model's attributes
		context = _.clone(this.model_target.attributes);

		// Make an array of texts split by the {{switch_user}}
		// delimiter
		textlines = context['text'].split("{{switch_user}}");	
		context['text'] = "<div class='text_line'>";

		_.each(textlines, _.bind(function (textline) {
			textline = this._reformatTextline(textline);
			context['text'] = [
									context['text'], 
									textline,
							  ].join("</div><div class='text_line'>");
		}, this));

		if (this.parent._getOpenConvo() === this._id) {
			this.model_target.set({seen: true});
		}

		this.$el.children().detach();
		// Append the template + context
		this.$el.append(this.template(context));
		this._scrollToEnd();
	},

	// Called during _createDialogues call in parent View
	initialize: function (attrs, opts) {
		this._id = attrs['id'];
		this.parent = attrs['parent'];
		this.model_target = this.parent.collection.get(this._id);

		this._setSubmitEvents();
		// See if the system works even if I take away this line
		// this._startLongPoll();
		this.closeChatbox();
		
		this.listenTo(this.parent, "closeOtherChatboxes", this.closeChatbox);
		this.listenTo(this, "open", this.openChatbox);
	},
	
});