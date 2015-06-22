// The view that handles all the Conversations
var ConvoView = Backbone.View.extend({

	el: ".chat-menu",
	template: _.template($("#chat-menu-template").html()),
	chat_menu_minimized: true,

	dialogues: {},

	events: {
		"click .min-button": "minimizeChatMenu",
		"click .close-button": "hideChatMenu",
		"click li.convo-line-item": "openDialogue",
	},

	// @desc: Gets ID number of the Open Conversation
	// @params: None
	// @res: Int
	_getOpenConvo: function () {
		var $open_window, selector_str, result;
		$open_window = this.$el.next().children();
		if ($open_window.length !== 1) {
			return undefined;
		}
		selector_str = $open_window.attr('id');
		result = parseInt(selector_str.replace(/chat-window/g, ""), 10);
		return result;
	},

	// @desc: minimizes the chat menu
	// @params: Event object
	// @res: Void
	minimizeChatMenu: function (event) {
		if (this.chat_menu_minimized) {
			this.$el.parent().addClass('minimizeChatMenu');
			$(event.currentTarget).html(_.unescape("<i class='fa fa-square-o'></i>"));
		} else {
			this.$el.parent().removeClass('minimizeChatMenu');
			$(event.currentTarget).html(_.unescape("<b>_</b>"));
		}
		this.chat_menu_minimized = !this.chat_menu_minimized;
	},

	// @desc: Recursive long-polling function
	// @params: None
	// @res Void
	updateConvos: function () {
		this.collection.fetch({
			timestamp: (new Date()).toISOString().replace(/\+/g, " ")
		}).always(_.bind(function () {
			this.updateConvos();
		}, this));
	},

	// @desc: Generate a new Chat View to store in this.dialogues
	// 	 	  and apply event listeners to its model
	// @params: Backbone Model object
	// @res: Void
	_createDialogue: function (model) {
		var _id, $new_div, div_id;
		// Get the model id
		_id = model.attributes['id'];
		div_id = ["#chat-window", _id.toString()].join("");
		$new_div = $(document.createElement("div"));
		$new_div.attr('id', div_id.slice(1, div_id.length));
		$new_div.addClass('chat-window');
		$new_div.addClass('user-chat-spec');

		this.view.$el.find('#chat-window').append($new_div);
		
		// Initialize a ChatView 
		this.dialogues[_id] = new ChatView({
				id: _id,
				parent: this,
				el: div_id
		});
		// Set an event listener on the model to re-render the chat menu
		// if there's a change in the seen status
		this.listenTo(model, "change:seen", this.render);
		this.listenTo(model, "change:seen", this.updateSeenStatus);
		this.listenTo(this.dialogues[_id], "resetChatTops", _.bind(function (change_count_only) {
			_.each(this.dialogues, _.bind(function (view) {
				this.trigger('resetChatTops', view, change_count_only);
			}, this));
		}, this));
	},

	// @desc: Sends new seen status to the DB
	// @params: Backbone Model object
	// @res: Void
	updateSeenStatus: function (model) {
		// Send changes 
		model.save({
			seen: model.attributes['seen'],
			user_a: model.attributes['user_a'],
			user_b: model.attributes['user_b'],
		}, {silent: true, patch: true});
	},

	// @desc: Open the ChatView based on either data stored on
	// 		  the event's current target OR on a given integer
	// @params: event (could be an Event object OR an integer)
	// @res: Void
	openDialogue: function (event) {
		var _id, new_convo;
		// Determine nature of event
		if (typeof event !== "number") {
			// Event is an event object
			_id = $(event.currentTarget).find("input[name='convo-id']")
										.val();
		}
		else {
			// event is actually just an id number
			_id = event;
		}
		
		// Trigger a "closeOtherChatboxes" event
		// to turn off event listeners of other models
		// this.trigger('closeOtherChatboxes');

		// Branching for new or old dialogues (this bases everything on the open views)
		if (_.has(this.dialogues, _id)) {

			// Old dialogues
			this.dialogues[_id].trigger('open');
			// Tell collection that you've seen this convo
			this.collection.get(_id).set({seen: true});
		} else {

			// New dialogues
			// create a new Convo model
			new_convo = new Convo({"user_targ": _id});
			// Save this model with the user_targ == _id
			new_convo.save({}, {silent: true})
					 .done(_.bind(function (response) {
					 	new_convo.unset("user_targ", {silent: true});
					 	new_convo.set({"user": response['user'], "seen":true}, {silent: true});
					 	this.collection.add(new_convo);
					 	// this.collection.get(new_convo.attributes['id']).set({seen: true});
					 	this.openDialogue(new_convo.attributes['id']);
					 }, this));
		}
	},

	// @desc: Triggers the closeChatBox event
	// @params: None
	// @res: Void
	hideChatMenu: function () {
		this.trigger('closeChatBox');
	},

	// @desc: Render the Convo Menu
	// @params: Boolean object
	// @res: Void
	render: function (initial) {
		var $target_element;

		initial && typeof initial ==="boolean" ? initial = true: initial = false;

		if (initial) {
			$target_element = this.$el.find("ul");
		} else {
			$target_element = this.$el.find(".mCSB_container");
		}
		
		$target_element.find("li.convo-line-item").detach();

		// Iterate along the collection
		this.collection.each(_.bind(function (model) {

			var context, line_item_html, text_items, parsed_time;
			
			context = _.clone(model.attributes);
			// Set context[text] to the last exchange between user_a and user_b
			text_items = context['text'].split("{{switch_user}}");
			text_items = text_items[text_items.length -1];
			// If the last line is not the spinner icon, set "text"
			// in context to the last exchange (escaped) (not including the user label)
			if (text_items !== "<i class='fa fa-spinner fa-spin'></i>") {
				text_items = text_items.split(":");
				text_items = text_items.slice(1, text_items.length).join(":");
				text_items = _.escape(text_items);
			} else {
				// We want the waiting icon to spin to its heart's content
				// so unescape that icon
				text_items = _.unescape(text_items);
				// text_items = "Pending...";
			}
			// Set profile pic
			if (_.has(context, "msg_profile_pic") && context["msg_profile_pic"] !== undefined) {
				context["msg_profile_pic"] = this.view.setMediaPic(context, "msg_profile_pic"); 
			}
			
			// Reduce the "Text" context of the menu to the last line
			context["text"] = text_items;
			context["time_initiated"] = new Date(context["time_initiated"].replace(/\+(\d){2}:(\d){2}/g, ""));
			context["time_initiated"]= context["time_initiated"].toLocaleTimeString();
			context["time_initiated"] = context["time_initiated"].replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3")

			// Append to the ul the line item conversation
			$target_element.append(this.template(context));
		

			// Add a star to the line if the convo is unseen AND
			// if that current conversation is not open right now
			line_item_html = $target_element.children('li.convo-line-item')
											.last()
											.html();

			!context["seen"] ? $target_element.children('li.convo-line-item')
											  .last()
											  .html([
											  			"<i class='fa fa-star fa-spin'></i>",
											  			line_item_html
											  		].join("")) : undefined;


			// Create ChatView instance for each model
			if (!_.has(this.dialogues, model.attributes['id'])) {
				this._createDialogue(model);
			}
		}, this));

		// Once everything is loaded, set the Scrollbar
		if (initial) {
			$target_element.mCustomScrollbar({theme: "dark"});
		} else {
			$target_element.mCustomScrollbar("update");
		}
	},

	// @desc: Tells HeaderView what the number of seen messages are
	// @params: None
	// @res: Void
	updateSeenCount: function () {
		var seen_models;
		// Render Convo-View
		this.render();
		seen_models = this.collection.filter(function (model) {
			return !model.attributes['seen'];
		});
		this.view.adjustCountVar(seen_models.length);
	},

	// @desc: Runs the necessary things for ConvoView
	// @params: Object, Object
	// @res: Void
	initialize: function (attrs, opts) {
		this.view = attrs["parent"];
		// Use bootstrapped values to start
		this.collection = new Convos(CONVOS);
		// Render the conversations
		this.render(true);

		this.updateConvos();
		this.updateSeenCount();

		this.listenTo(this.collection, "add", this.render);
		this.listenTo(this.collection, "change", this.updateSeenCount);
	},
	
});