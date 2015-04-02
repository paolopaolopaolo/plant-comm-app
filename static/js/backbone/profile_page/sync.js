// Backbone dependent implementation, encapsulated in a function call
(function () {
	"use strict";
	var originalSync, ajaxSet;

	ajaxSet = function () {
		// Filter for method
		function csrfSafeMethod(method) {
			// these HTTP methods do not require CSRF protection
				 return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
		}

		// Setup jQuery AJAX implementation
		$.ajaxSetup({
			// beforeSend: if neither unnecessary or dangerous, attach
			// CSRF token to the header
		    beforeSend: function(xhr, settings) {
		        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
		            xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken'));
		       	}
		    }
		});
	};

	if (Backbone){
		// Set the template settings
		_.templateSettings = {
  			interpolate: /\{\{(.+?)\}\}/g,
		};

		// Store an original of Backbone.sync
		originalSync = Backbone.sync;

		// Override Backbone.sync to attach csrf-token to xhr
		Backbone.sync = function () {
			ajaxSet();
			// Continue standard implementation
			return originalSync.apply(this, arguments);
		};
		ajaxSet();		
	} else {
		// I can add non-backbone code here if I like.
		alert('Backbone not loaded! Site functionality will be limited');
	}
})();
