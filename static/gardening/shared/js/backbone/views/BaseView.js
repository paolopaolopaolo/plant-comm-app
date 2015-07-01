var BaseView = Backbone.View.extend({

	el: "body",
	events: {
		"click": "closeDropdown",
		"click .p-header-contact-btn": "openDialogue",
	},

	// @desc: CALLED FROM PROFILE EDITS:: 
	//        Takes Gardener model changes and propagates it to UI elements
	// @params: Object
	// @res: Void
	propagateChanges: function (object) {
		var name, value, $targets;

		for (name in object) {
			if (object.hasOwnProperty(name)) {
				value = object[name];
				$targets = this.$el
							   .find([
										".handler",
										name
									].join("-"));
				_.each($targets, _.bind(function (target) {
					$(target).html(object[name]);
				}, this));
			}
		}
	},

	// @desc: Opens Chat Dialogue When Clicking Contact button
	// @params: int
	// @res: Void
	openNewDialogue: function (user_id) {
		if (!isChatDisabled) {
			// Find and filter through the collection
			// for models where user_id is either user_a or
			// user_b
			var filtered_value;
			filtered_value = this.header_view
								 .convo_view
								 .collection
								 .find(_.bind(function (model) {
										return model.attributes['user_a'] === user_id || 
					  					 model.attributes['user_b'] === user_id;
								 }, this));

			// If filtered value is not undefined
			if (filtered_value) {
				// Use the id of the model found
				this.header_view.convo_view.openDialogue(filtered_value.id);
			} else {
				// If it is undefined, use the given id directly 
				this.header_view.convo_view.openDialogue(user_id, true);
			}
		}
	},

	// @desc: Open Dialogue UI wrapper function. Gets the id
	//        from UI hidden input and calls the previous function
	// @params: Event object
	// @res: Void
	openDialogue: function (event) {
		var _id = parseInt($(event.currentTarget).parents(".profile-header")
												  .find("input[name='contact-id']")
												  .val(), 10);
		this.openNewDialogue(_id);
	},


	// @desc: Close all dropdown menus in response to clicking anywhere
	// @params: Event object
	// @res: Void
	closeDropdown: function (event) {
		var isClosingDropdowns, parents_count;

		parents_count = $(event.target).parents(".dropdown").length;

		isClosingDropdowns = !Boolean(parents_count);

		if (isClosingDropdowns) {
			this.header_view.closeChatBox();
			this.header_view.toggleMenu(false);
		}
	},

	// @desc: Initialize function for Base View
	// @params: None
	// @res: Void
	initialize: function () {
		this.header_view = new HeaderView();
	},

});

var bv = new BaseView();