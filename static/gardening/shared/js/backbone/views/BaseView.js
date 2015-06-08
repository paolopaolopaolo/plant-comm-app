var BaseView = Backbone.View.extend({

	el: "body",
	events: {
		"click": "closeDropdown",
		"click .p-header-contact-btn": "openDialogue",
	},

	openNewDialogue: function (user_id) {
		// Find and filter through the collection
		// for models where user_id is either user_a or
		// user_b
		var filtered_value;
		filtered_value = this.header_view.convo_view.collection.find(_.bind(function (model) {
			return model.attributes['user_a'] === user_id || 
				   model.attributes['user_b'] === user_id;
		}, this));

		
		if (filtered_value) {
			this.header_view.convo_view.openDialogue(filtered_value.id);
		} else {
			this.header_view.convo_view.openDialogue(user_id);
		}
		// _.each(this.convoview.dialogues, _.bind(function (dialogue) {
		// 	this.resetChatTops(dialogue);
		// }, this));
	},

	openDialogue: function (event) {
		var _id = parseInt($(event.currentTarget).parents(".profile-header")
												  .find("input[name='contact-id']")
												  .val(), 10);
		this.openNewDialogue(_id);
			// target_dialogue;
			// target_dialogue = _.findKey(this.header_view.convo_view.dialogues, function (dialogue) {
			// 	return dialogue.target_user === _id;
			// });

			// this.header_view.convo_view.dialogues[target_dialogue].openChatbox();
			// // alert(target_dialogue);	
	},


	closeDropdown: function (event) {
		var isClosingDropdowns, parents_count;

		parents_count = $(event.target).parents(".dropdown").length;

		isClosingDropdowns = !Boolean(parents_count);

		if (isClosingDropdowns) {
			this.header_view.closeChatBox();
			this.header_view.toggleMenu(false);
		}
	},

	initialize: function () {
		this.header_view = new HeaderView();
	},

});

var bv = new BaseView();