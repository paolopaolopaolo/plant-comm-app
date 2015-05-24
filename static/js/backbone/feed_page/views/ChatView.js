// The view for the Chat Menu

var ChatView = Backbone.View.extend({

	template: _.template($("#chat_window_template").html()),
	text_template: _.template($("#chat_text_template").html()),

	end_poll: false,

	open: false,

	inInitialize: true,

	minimized: false,

	events: {
		"click .close_chat_win": "closeChatbox",
		"click .minimize_chat_win": "minimizeChatbox",
	},

	_scrollToEnd: function () {
		var $chatText;
		$chatText = this.$el.find(".chatText");
		$chatText.scrollTop($chatText.prop('scrollHeight'));
	},

	_toggleChatboxStyle: function (bool) {
		var minimize_obj;
		if (bool) {
			this.$el.animate({'height': '300px'});
			this.$el.removeAttr('style');
			this.$el.find('.chatText').removeAttr('style');
			this.$el.find('input[name="user_chat_line"]').removeAttr("style");	
			return "_";
		} else {
			this.$el.css({'position':'relative'});
			this.$el.animate({'height': "25px"});
			this.$el.find('.chatText').css({'height': "0px"});
			this.$el.find('input[name="user_chat_line"]').css({'display': "none"});
			return "<i class='fa fa-square-o'></i>";
		}
	},

	minimizeChatbox: function (event) {
		var button_content;
		button_content = this._toggleChatboxStyle(this.minimized);
		$(event.currentTarget).html(button_content);
		this.minimized = !this.minimized;
		this.trigger('resetChatTops');
	},

	// Closes Event Listeners for this ChatView
	closeChatbox: function () {
		this.$el.css({"padding": "0", "width": "0", "height": "0"});
		this.$el.children().detach();
		this.open = false;
		this.minimized = false;
		this.trigger('resetChatTops');
	},

	// Opens Event Listeners for the Chatview
	openChatbox: function (do_not_render_page) {
		this.listenTo(this.model_target, "change:text", this.textRender);
		if (!do_not_render_page) {
			this.render();
			this.open = true;
		}
		this.minimized = false;
		this.trigger('resetChatTops');
	},

	// Set event listener on target element that triggers 'pressEnter'
	_setSubmitEvents: function () {
		// Enables pressing enter to submit
		this.$el.on("keyup", "input[name='user_chat_line']", _.bind(function (event) {
			if (event.keyCode === 13) {
				event.preventDefault();
				this.trigger("pressEnter");
			}
		}, this));
	},

	// Submits a message using Backbone.save()
	_submitMessage: function () {
		var text_to_save, input_val;
		input_val = this.$el.find('input[name="user_chat_line"]').val();
		if (input_val.length > 0) {
			text_to_save = [
				this.model_target.attributes['text'],
				USER + ": " + input_val
			].join("{{switch_user}}");
			
			this.model_target.save({
				'text': text_to_save,
			}).done(_.bind(function () {
				this.$el.find('input[name="user_chat_line"]').val("");
			}));
		}
	},

	_alertTimeChange: function () {
		alert(this.model_target.attributes['time_initiated']);
	},


	_reformatTextline: function (textline) {
		var line_components, name, text;
		line_components = textline.split(':');
		name = line_components[0];
		text = line_components[1];
		if (text) {
			if (text.length > 0) {
				if (name === USER) {
					result = [
						"<div class='chat_format self_text'>",
						_.escape(text),
						"</div>"
					].join("");
				} else {
					result = [
						"<div class='chat_format other_text'>",
						_.escape(text),
						"</div>"
					].join("");
				}
			}
		}
		else {
			result = "";
		}
		// _.each(line_components, _.bind(function (line_component, idx) {
		// 	var join_element = ": ";
		// 	line_component = _.escape(line_component);
		// 	if (idx === 0) {
		// 		line_component = [
		// 			"<b>",
		// 			line_component,
		// 			"</b>"
		// 		].join("");
		// 		join_element = "";
		// 	} 
		// 	result = [
		// 		result,
		// 		line_component
		// 	].join(join_element);
		// }, this));
		return result;
	},

	// Render the text within the Chatboxes
	textRender: function () {
		var context, textlines;
		context = _.clone(this.model_target.attributes);
		// Make an array of texts split by the {{switch_user}}
		// delimiter
		textlines = context['text'].split("{{switch_user}}");	
		context['text'] = "<div class='text_line'>";

		// Iterate along text array
		_.each(textlines, _.bind(function (textline) {
			textline = this._reformatTextline(textline);
			if (textline !== "") {
				context['text'] = [
										context['text'], 
										textline,
								  ].join("</div><div class='text_line'>");
			}
		}, this));

		// Delete everything in the chatbox
		this.$el.find(".chatText").children().detach();
		// Append the template + context to the chatbox
		this.$el.find(".chatText").append(this.text_template(context));

		this.$el.find('input[name="user_chat_line"]').val("");
		this._scrollToEnd();
	},

	// Renders changes to the chat window
	render: function () {
		var context = _.clone(this.model_target.attributes);
		this.$el.children().detach();
		if (this.parent._getOpenConvo() === this._id) {
			this.model_target.set({seen: true});
		}
		// Append the template + context
		this.$el.removeAttr("style");
		this.$el.append(this.template(context));
		this.textRender();
		this._scrollToEnd();
	},

	// Called during _createDialogues call in parent View
	initialize: function (attrs, opts) {
		this._id = attrs['id'];
		this.parent = attrs['parent'];
		this.model_target = this.parent.collection.get(this._id);
		this.$el.css("padding", "0px");

		this._setSubmitEvents();
		this.closeChatbox();
		this.openChatbox(true);
		
		this.listenTo(this, "open", this.openChatbox);
		this.listenTo(this, "pressEnter", this._submitMessage);
		this.inInitialize = false;
	},
	
});