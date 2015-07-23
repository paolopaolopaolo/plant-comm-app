var BaseView = Backbone.View.extend({

	el: "body",
	events: {
		"click": "closeDropdown",
		"click .p-header-contact-btn": "openDialogue",
		"click .p-header-follow-btn": "_toggleFollow"
	},

	// @HACK
	// @desc: Simple UI Function: Tell Backend to add user to the favorites list
	// @params: Event Object
	// @res: Void
	_toggleFollow: function (event) {
		var _id = this._getID(event);
		if (!this.collection.get(_id)) {
			this.collection.add({id: _id, favorite: true});
		}
		// Toggling happens on the back-end. This goes directly to a PUT request
		// since I added a model with an id to the collection. 
		this.collection.get(_id).save();
	},

	// @desc: Normalize the Media URL
	// @params: JS Object, String
	// @res: String
	setMediaPic: function (context, context_str) {
		var media_url, domain;

		context_str = (context_str === undefined ? 'profile_pic' : context_str);

		domain = MEDIA_URL;

		if (!(/http/).test(context[context_str])) {
			if (context[context_str] === undefined || context[context_str]==="") {
				return DEFAULT_PROFILE_PIC;
			}
			if (domain !== "/media/" && context[context_str].slice(0, 8) !== "/media/") {
				media_url = [
						domain,
						context[context_str]
				].join("");
			} else {
				media_url = context[context_str];
			}
		} else {
			media_url = context[context_str];
		}
		// #hack
		return media_url.replace(/\/media\/ *\/media\//g, "/media/");
	},

	// @desc: CALLED FROM PROFILE EDITS:: 
	//        Takes Gardener model changes and propagates it to UI elements
	// @params: Object, Integer
	// @res: Void
	propagateChanges: function (object, number) {
		var name, selector_name, value, $targets;

		for (name in object) {
			if (object.hasOwnProperty(name)) {
				value = object[name];
				selector_name = (number === undefined ? name : [name, number.toString()].join("-"));
				$targets = this.$el
							   .find([
										".handler",
										selector_name
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


	// @desc: Gets user ID from profile-header button
	// @params: Event Object
	// @res: Integer
	_getID: function (event) {
		var result = parseInt(
						$(event.currentTarget).parents(".profile-header")
											  .find("input[name='contact-id']")
											  .val(),
					    10
					 );
		return result;
	},

	// @desc: Open Dialogue UI wrapper function. Gets the id
	//        from UI hidden input and calls the previous function
	// @params: Event object
	// @res: Void
	openDialogue: function (event) {
		var _id = this._getID(event);
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

	// @desc: Searches page for profile-header corresponding to model
	// 		  and then changes the style according to the current state
	// @params: Backbone Model Object
	// @res: Void
	_parsePageForFollowedProfiles: function (model) {
		var follow_id, $button;
		follow_id = model.attributes["id"];
		$button = 	this.$el.find(".p-h-" + follow_id.toString())
						.find(".p-header-follow-btn");
		if (model.attributes["favorite"]) {
			$button.css({backgroundColor: "#666"})
				   .html("Followed");
		} else {
			$button.removeAttr("style");
			$button.html("Follow");
		}
	},

	// @desc: Initialize function for Base View
	// @params: None
	// @res: Void
	initialize: function () {
		this.header_view = new HeaderView({"setMediaPic": this.setMediaPic});
		this.collection = new Followers(FOLLOWERS);
		this.collection.each(_.bind(function (model) {
			this._parsePageForFollowedProfiles(model);
		}, this));
		this.listenTo(this.collection, "change", this._parsePageForFollowedProfiles);
	},

});

var bv = new BaseView();