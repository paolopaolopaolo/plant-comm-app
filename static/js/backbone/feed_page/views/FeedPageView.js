var FeedPageView = Backbone.View.extend({

	// Variables //
	SETTINGS_TOGGLE: true,

	el: "body",

	events: {
		'click #settings': 'showSettings',
		'click #settings-list li': 'triggerAnchor',
		'click .mail_button': 'startupChatView',
	},

	// Utility: Convert css/px to integer
	convertInt: function (str) {
		"use strict";
		return parseInt(str.replace(/px/g, ''), 10);
	},

	// Redirect to location of containing link
	triggerAnchor: function (event) {
		"use strict";
		window.location.href = $(event.currentTarget).children('a').attr('href');
	},

	// Toggles settings menu
	showSettings: function () {
		"use strict";
		var orig_height, orig_min_height;
		orig_height = this.convertInt($('#settings-list').css('height'));
		orig_min_height = 52;

		if (this.SETTINGS_TOGGLE) {
			// Store original height
			$('#settings-list').data('height', 
									 [ 
									 	orig_height.toString(),
									 	'px'
									 ].join(''));
			$('#settings-list').data('min-height', 
									 [ 
									 	orig_min_height.toString(),
									 	'px'
									 ].join(''));
			$('#settings').css({'border-radius': '5px'});
			$('#settings-list').animate({
											'height': '0px',
											'minHeight': '0px'
										});
		} else {
			$('#settings').css({'border-radius': '5px 5px 0 0'});
			$('#settings-list').animate({
											'height': $('#settings-list').data('height'),
											'minHeight': $('#settings-list').data('min-height'),
										});
		}
		this.SETTINGS_TOGGLE = !this.SETTINGS_TOGGLE;
	},

	// Count and start view for Chat View
	startupChatView: function () {
		this.$el.find("#chat_wrapper").css({'z-index': '10000000'});
	},

	showConvoNumber: function () {
		var new_num, init_button_html;
		new_num = this.convoview
					  .collection
					  .where({seen: false})
					  .length;

		this.$el.find(".mail_button")
				.html([
							'<i class="fa fa-envelope-o"></i>',
							new_num.toString()
					  ].join(" "));
	},

	closeChatBox: function () {
		this.$el
			.find("#chat_wrapper")
			.css({'z-index': '-100000000000'});
		this.convoview.trigger("closeOtherChatboxes");
	},

	// Function triggered by OGView
	openNewDialogue: function (user_id) {
		// Find and filter through the collection
		// for models where user_id is either user_a or
		// user_b
		var filtered_value;
		filtered_value = this.convoview.collection.find(_.bind(function (model) {
			return model.attributes['user_a'] === user_id || 
				   model.attributes['user_b'] === user_id;
		}, this));

		this.startupChatView();
		
		if (filtered_value) {
			this.convoview.openDialogue(filtered_value.id);
		} else {
			this.convoview.openDialogue(user_id);
		}
	},

	// Initialize UI for the page
	initialize: function () {
		"use strict";
		var new_convos;
		// Settings button UI
		this.ogview = new OGView({parent: this});
		this.showSettings();
		this.convoview = new ConvoView({parent: this});

		// Make the window draggable
		this.$el.find("#chat_wrapper").draggable({containment: "parent"});


		// Listen to ConvoView's collection changes to update the "new" number 
		this.listenTo(this.convoview.collection, "add", this.showConvoNumber);
		this.listenTo(this.convoview.collection, "change", this.showConvoNumber);
		this.listenTo(this.convoview.collection, "remove", this.showConvoNumber);

		// Listen to Children Views
		this.listenTo(this.convoview, "closeChatBox", this.closeChatBox);
		this.listenTo(this.ogview, "openNewDialogue", this.openNewDialogue);
		
		this.showConvoNumber();

	}

});

var fpv = new FeedPageView();