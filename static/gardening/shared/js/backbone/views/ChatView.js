// The view for the Chat Menu

var ChatView = Backbone.View.extend({

	template: _.template($("#chat-window-template").html()),
	text_template: _.template($("#chat-text-template").html()),

	end_poll: false,

	open: false,

	inInitialize: true,

	minimized: false,

	events: {
		"click .close-chat-win": "closeChatbox",
		"click .minimize-chat-win": "minimizeChatbox",
	},

	// @desc: Scrolls chat-text to the end of chat text box
	// @params: None
	// @res: Void
	_scrollToEnd: function () {
		var $chatText;
		$chatText = this.$el.find(".chat-text");
		$chatText.scrollTop($chatText.prop('scrollHeight'));
	},

	// @desc: Toggle the minimize styling of the Chat window
	// @params: Boolean
	// @res: String
	_toggleChatboxStyle: function (toOpen) {
		if (toOpen) {
			this.$el.css({'height': '300px'});
			this.$el.removeAttr('style');
			this.$el.find('.chat-text').removeAttr('style');
			this.$el.find('input[name="user-chat-line"]').removeAttr("style");
			this.$el.find('.chat-text').mCustomScrollbar("scrollTo", "bottom");	
			return "_";
		} else {
			this.$el.css({'position':'relative', 'height': '37px'});
			this.$el.find('.chat-text').css({'height': '0px'});
			this.$el.find('input[name="user-chat-line"]').css({'display': "none"});
			return "<i class='fa fa-square-o'></i>";
		}
	},

	// @desc: Minimize the Chatbox
	// @params: Event object
	// @res: Void
	minimizeChatbox: function (event) {
		var button_content;
		button_content = this._toggleChatboxStyle(this.minimized);
		$(event.currentTarget).html(button_content);
		this.minimized = !this.minimized;
		this.trigger('resetChatTops');
	},

	// @desc: Closes Event Listeners for this ChatView
	// @params: None
	// @res: Void
	closeChatbox: function () {
		this.stopListening(this.model_target, "change:text");
		this.listenTo(this.model_target, "change:text", this.openChatbox);
		this.$el.addClass("chat-box-hide");
		this.$el.children().detach();
		this.open = false;
		this.minimized = false;
		this.trigger('resetChatTops');
	},

	// @desc: Opens Event Listeners for the Chatview
	// @params: None
	// @res: Void
	openChatbox: function () {
		this.stopListening(this.model_target, "change:text");
		this.listenTo(this.model_target, "change:text", this.textRender);
		this.render();
		this.open = true;
		this.minimized = false;
		this.trigger('resetChatTops');
	},

	// @desc: Set event listener on target element that triggers 'pressEnter'
	// @params: None
	// @res: Void
	_setSubmitEvents: function () {
		// Enables pressing enter to submit
		this.$el.on("keyup", "input[name='user-chat-line']", _.bind(function (event) {
			if (event.keyCode === 13) {
				event.preventDefault();
				this._submitMessage();
			}
		}, this));
	},

	// @desc: Submits a message using Backbone.save()
	// @params: None
	// @res: Void
	_submitMessage: function () {
		var text_to_save, input_val;
		input_val = this.$el.find('input[name="user-chat-line"]').val();
		if (input_val.length > 0) {
			text_to_save = [
				this.model_target.attributes['text'],
				USER + ": " + input_val
			].join("{{switch_user}}");
			
			this.model_target.save({
				'text': text_to_save,
			});
			this.$el.find('input[name="user-chat-line"]').val("");
		}
	},

	// @desc: Re-formats each line of text
	// @params: String
	// @res: String
	_reformatTextline: function (textline) {
		var line_components, name, text;
		line_components = textline.split(':');
		name = line_components[0];
		text = line_components.slice(1, line_components.length).join(":");
		if (text) {
			if (text.length > 0) {
				if (name === USER) {
					result = [
						"<div class='chat-format self-text'>",
						_.escape(text),
						"</div>"
					].join("");
				} else {
					result = [
						"<div class='chat-format other-text'>",
						_.escape(text),
						"</div>"
					].join("");
				}
			}
		}
		else {
			result = "";
		}
		return result;
	},

	// @desc: Render the text within the Chatboxes
	// @params: Boolean
	// @res: Void
	textRender: function (isInitial) {
		var context, textlines, useFancyScrollbar;
		context = _.clone(this.model_target.attributes);

		useFancyScrollbar = (typeof isInitial === "boolean" ? isInitial:  false);

		// Make an array of texts split by the {{switch_user}}
		// delimiter
		textlines = context['text'].split("{{switch_user}}");	
		context['text'] = "<div class='text-line'>";

		// Iterate along text array
		_.each(textlines, _.bind(function (textline, idx) {
			if (idx !== 0) {
				textline = this._reformatTextline(textline);
			}
			else {
				textline = [
								"<div class='chat-format info-text'>",
								"You've started a chat dialogue with ",
								"<b>",
								context["user"],
								"</b>",
								"! Type in your message in the text prompt ",
								"and press enter to say hello!",
								"</div>"
							].join("");
			}
			if (textline !== "") {
				context['text'] = [
										context['text'], 
										textline,
								  ].join("</div><div class='text-line'>");
			}
		}, this));

		context['text'] = [context['text'], "</div>"].join("");

		// Append the template + context to the chatbox
		if (useFancyScrollbar) {
			this.$el.find(".chat-text").html(this.text_template(context));
			this.$el.find(".chat-text").mCustomScrollbar({
				theme: "dark",
				advanced: {
					updateOnContentResize: true,
				},
				callbacks: {
					onInit: _.bind(function () {
						this.$el.find(".chat-text").mCustomScrollbar("scrollTo", "bottom");
					}, this),	
					onUpdate: _.bind(function () {
						this.$el.find(".chat-text").mCustomScrollbar("scrollTo", "bottom");
					}, this),
				}
			});
		} else {
			this.$el.find(".mCSB_container").html(this.text_template(context));
			this.$el.find(".chat-text").mCustomScrollbar("scrollTo", "bottom");
		}

		
		// this.$el.find('input[name="user-chat-line"]').val("");
		// this._scrollToEnd();
		this.model_target.set({'seen': true }, {'patch': true});
	},

	// @desc: Renders changes to the chat window
	// @params: None
	// @res: Void
	render: function () {
		var context = _.clone(this.model_target.attributes);
		this.$el.children().detach();
		if (this.parent._getOpenConvo() === this._id) {
			this.model_target.set({seen: true});
		}
		// Append the template + context
		this.$el.removeAttr("style");
		this.$el.removeClass("chat-box-hide")
		this.$el.append(this.template(context));
		this.textRender(true);
	},

	// @desc: Called during _createDialogues call in parent View
	// @params: Object, Object
	// @res: Void
	initialize: function (attrs, opts) {
		this._id = attrs['id'];
		this.parent = attrs['parent'];
		this.model_target = this.parent.collection.get(this._id);
		this.target_user = this.model_target.attributes["user"];
		this.$el.css("padding", "0px");

		this._setSubmitEvents();
		this.closeChatbox();
		
		this.listenTo(this, "open", this.openChatbox);
		this.inInitialize = false;
	},
	
});