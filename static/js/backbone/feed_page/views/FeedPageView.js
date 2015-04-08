var FeedPageView = Backbone.View.extend({

	// Variables //
	SETTINGS_TOGGLE: true,

	el: "body",

	events: {
		'click #settings': 'showSettings',
		'click #settings-list li': 'triggerAnchor',
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

	// Initialize UI for the page
	initialize: function () {
		"use strict";
		// Settings button UI
		this.ogview = new OGView();
		this.showSettings();
		console.dir(OTHER_GARDENERS);
	}

});

var fpv = new FeedPageView();