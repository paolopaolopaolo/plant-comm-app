var HeaderView = Backbone.View.extend({

	el: '.header',

	// @desc: Number of maximized chat windows
	maximized_num: 0,

	// @desc: Toggle value for header menu
	isMenuShowing: false,

	isChatMenuShowing: false,

	events: {
		'click .click-down': 'toggleMenu',
		'click .toggle-menu': '_goToLink',
		'click .chat-btn': 'openChatBox',
	},

	// @desc: List of selectors to turn 
	// 		  into objects
	selectors: [
					'.toggle-menu-wrapper',
					'.chat-menu-wrapper'
				],

	// @desc: An object of keys-to-jQuery objects
	$$vars: {},

	// @desc: Normalize the Media URL
	// @params: JS Object, String, String
	// @res: String
	setMediaPic: function (context, context_str, cdn_url) {
		var media_url, domain;

		context_str = (context_str === undefined ? 'profile_pic' : context_str);

		domain = MEDIA_URL;

		if (context[context_str].indexOf('http') < 0) {
			if (context[context_str] === undefined || context[context_str]==="") {
				return DEFAULT_PROFILE_PIC;
			}
			media_url = [
					domain,
					context[context_str]
			].join("");
		} else {
			media_url = context[context_str];
		}
		return media_url;
	},

	// @desc: Counts the number of maximized chat windows
	// @param: None
	// @res: int 
	_countMaximizedChatWindows: function () {
		var max_chat_win_num;

		max_chat_win_num = _.filter(this.convo_view.dialogues, function (dialogue) {
			return dialogue.open && !dialogue.minimized;
		}).length;

		return max_chat_win_num;
	},

	// @HACK
	// @desc: Reset the top style of the chat-windows
	// @param: Backbone View Object, Boolean
	// @res: Void
	resetChatTops: function (view, change_count_only) {
		this.maximized_num = this._countMaximizedChatWindows(); 
		if (!change_count_only) {
			if (this.maximized_num < 1) {
				this.$el.find('.chat-window').css("top", "0px");
			} else {
				view.$el.css('top', '275px');
			}
		}
	},


	// @desc: Extends anchor-tag UI to the surrounding
	// 		  li tag
	// @params: Event object
	// @res: Void
	_goToLink: function (event) {
		var $dest;
		$dest = $(event.target).children('a');
		console.log($dest.attr('href'));
		if ($dest.length === 1) {
			window.location.href = $dest.attr('href');
		}
	},

	// @desc: Clicking on .clickdown will 
	// 		  show dropdown menu and change
	// 		  the toggle value 'isMenuShowing'
	// @params: Boolean
	// @res: Void
	toggleMenu: function (isGoingToShow) {
		var $menu = this.$$vars['.toggle-menu-wrapper'],
			isForcedToShow;

		// Set the force toggle variable
		isForcedToShow = (isGoingToShow !== undefined ? 
							isGoingToShow : !this.isMenuShowing)
		

		if (isForcedToShow) {
			// Hide the chat-menu
			this.closeChatBox();
			// If is-forced-to-show is true, show the menu
			$menu.addClass('show-hidden');
			this.isMenuShowing = true;
		} else {
			// If it is false, hide the menu
			$menu.removeClass('show-hidden')
			this.isMenuShowing = false;
		}
	},

	// @desc: Populates this.$$vars with the jQuery 
	// 		  variables for all the UI elements in
	// 		  this view
	// @params: None
	// @res: Void
	_setJqueryVars: function () {
		_.each(this.selectors, _.bind(function (selector) {
			var $object = this.$el.find(selector);
			if ($object.length > 0) {
				this.$$vars[selector] = $object;
			} else {
				this.$$vars[selector] = 'Selector not active';
			}
		}, this));

	},


	// @desc: Forces the chat menu wrapper to hide
	// @params: None
	// @res: Void
	closeChatBox: function () {
		this.$$vars['.chat-menu-wrapper'].addClass('hidden');
		this.isChatMenuShowing = false;
	},

	// @desc: Toggles the chat menu wrapper
	// @params: None
	// @res: Void
	openChatBox: function () {
		if (this.isChatMenuShowing) {
			this.closeChatBox();
		} else {
			this.toggleMenu(false);
			this.$$vars['.chat-menu-wrapper'].removeClass('hidden');
			this.isChatMenuShowing = !this.isChatMenuShowing;
		}
	},

	// @desc: Perform all the tasks needed when loading HeaderView
	// @params: None
	// @res: None
	initialize: function () {
		this._setJqueryVars();
		if (!isChatDisabled) {
			this.convo_view = new ConvoView({parent: this});
			this.closeChatBox();
			this.listenTo(this.convo_view, "closeChatBox", this.closeChatBox);
			this.listenTo(this.convo_view, "resetChatTops", this.resetChatTops);
		}
	},

});
