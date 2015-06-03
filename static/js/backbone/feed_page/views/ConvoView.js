// The view that handles all the Conversations
var ConvoView = Backbone.View.extend({

	el: "#chat_menu",
	template: _.template($("#chat_menu_template").html()),
	chat_menu_minimized: true,

	dialogues: {},

	events: {
		"click .min_button": "minimizeChatMenu",
		"click .close_button": "hideChatMenu",
		"click li.convo_line_item": "openDialogue",
		// "click button.del_convo": "deleteDialogue",
	},

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

	// Long Poll the collection
	updateConvos: function () {
		this.collection.fetch({
			timestamp: (new Date()).toISOString().replace(/\+/g, " ")
		}).always(_.bind(function () {
			this.updateConvos();
		}, this));
	},

	// Return the id of the open conversation
	// Return undefined if there are no conversations open
	_getOpenConvo: function () {
		var $open_window, selector_str, result;
		$open_window = this.$el.next().children();
		if ($open_window.length !== 1) {
			return undefined;
		}
		selector_str = $open_window.attr('id');
		result = parseInt(selector_str.replace(/chat_window/g, ""), 10);
		return result;
	},

	// Create a new dialogue (after bootstrapping)
	_createDialogue: function (model) {
		var _id, $new_div, div_id;
		// Get the model id
		_id = model.attributes['id'];
		div_id = ["#chat_window", _id.toString()].join("");
		$new_div = $(document.createElement("div"));
		$new_div.attr('id', div_id.slice(1, div_id.length));
		$new_div.addClass('chat_window');
		$new_div.addClass('user_chat_spec');

		this.view.$el.find("#chat_window").append($new_div);
		
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

	updateSeenStatus: function (model) {
		// Send changes 
		model.save({
			seen: model.attributes['seen'],
			user_a: model.attributes['user_a'],
			user_b: model.attributes['user_b'],
		}, {silent: true, patch: true});
	},

	// Open the Dialogue based on the model
	openDialogue: function (event) {
		var _id, new_convo;
		// Determine nature of event
		if (typeof event !== "number") {
			// Event is an event object
			_id = $(event.currentTarget).find("input[name='convo_id']")
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
					 	new_convo.set({"user": response['user']}, {silent: true});
					 	this.collection.add(new_convo);
					 	this.collection.get(new_convo.attributes['id']).set({seen: true});
					 	this.openDialogue(new_convo.attributes['id']);
					 }, this));
		}
	},

	hideChatMenu: function (event) {
		this.trigger('closeChatBox');
	},

	render: function (initial) {
		var $target_element;

		!initial ? initial = false: initial = true;

		$target_element = this.$el.children("ul");
		$target_element.children("li.convo_line_item").detach();

		// Iterate along the collection
		this.collection.each(_.bind(function (model) {
			var context, line_item_html, text_items;
			
			context = _.clone(model.attributes);
			// Set context[text] to the last exchange between user_a and user_b
			text_items = context['text'].split("{{switch_user}}");
			text_items = text_items[text_items.length -1];
			// If the last line is not the spinner icon, set "text"
			// in context to an escaped string (not including the user label)
			if (text_items !== "<i class='fa fa-spinner fa-spin'></i>") {
				text_items = text_items.split(":");
				text_items = _.escape(text_items[text_items.length -1]);
			} else {
				// We want the waiting icon to spin to its heart's content
				// so unescape that icon
				text_items = "Pending...";
			} 

			// Reduce the "Text" context of the menu to the last line
			context["text"] = text_items;

			// Append to the ul the line item conversation
			$target_element.append(this.template(context));

			// Add a star to the line if the convo is unseen AND
			// if that current conversation is not open right now
			line_item_html = $target_element.children('li.convo_line_item')
											.last()
											.html();

			!context["seen"] ? $target_element.children('li.convo_line_item')
											  .last()
											  .html([
											  			"<i class='fa fa-star'></i>",
											  			line_item_html
											  		].join("")) : undefined;


			// Create ChatView instance for each model
			if (!_.has(this.dialogues, model.attributes['id'])) {
				this._createDialogue(model);
			}
		}, this));
	},

	initialize: function (attrs, opts) {
		this.view = attrs["parent"];
		// Use bootstrapped values to start
		this.collection = new Convos(CONVOS);
		// Render the conversations
		this.render(true);

		this.updateConvos();

		this.listenTo(this.collection, "add", this.render);
		this.listenTo(this.collection, "change", this.render);

	},
	


});