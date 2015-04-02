// Cached Variables and Functions



// An encapsulated LandingPage object
// Carries all the required interactivity
// for the landing page 
function LandingPage($) {
	"use strict";

	// Cached FORM_TOGGLE variable
	var FORM_TOGGLE = true;

	// Set jQuery instance to noConflict
	$ = $.noConflict(true);

	// jQuery plugin, _show, that removes dynamic
	// styling after calling show function
	$.fn._show = function () {
		var $this = this;
		$this.show({ 
			complete: function () {
				$this.removeAttr('style');
				$this.find('ul').removeAttr('style');
			} 
		});
	};

	// Toggles the form between the 
	// signup and login forms, given a 
	function toggleForm(formval) {
		"use strict";
		// Initialize Variables
		var $top_form,
			$bottom_form,
			$button,
			button_label;
		// Set entities (swap button, and the forms)
		$button = $('#swap_forms');
		$top_form = $("#signup");
		$bottom_form = $("#login");
		// Hide both forms
		$top_form.hide();
		$bottom_form.hide();
		// Choose which form to show based
		// on formval boolean
		if (formval) {
			$bottom_form._show();
			button_label = "Sign Up";
		} else if (!formval){
			$top_form._show();
			button_label = "Login";
		}
		// Rename Button
		$button.html(button_label);
		//Don't reenable click events until after 500ms
		setTimeout(function () {
			enableFormToggle();
		}, 500);
	}

	// Saves FORM TOGGLE on submission
	function saveToggleOnSubmit() {
		"use strict";
		// Set one-time submit handler
		$("form").one("submit", function (event) {
			// Initialize expiry time
			var expiry;
			// Prevent default submission 
			event.preventDefault();
			// Set form_toggle as cookie
			// with expiry date as ~5 seconds
			expiry = new Date();
			expiry.setTime(expiry.getTime() + 5000);
			$.cookie(
				'form_toggle',
				FORM_TOGGLE.toString(),
				{ expires: expiry }
			);
			// Submit form
			$(this).submit();
		});
	}

	// Set up onetime click event that toggles forms
	// and then changes FORM_TOGGLE
	function enableFormToggle() {
		"use strict";
		$("#swap_forms").one("click", function () {
			toggleForm(FORM_TOGGLE);
			FORM_TOGGLE = !FORM_TOGGLE;
		});
	}

	// Fade out errors on page load
	function fadeOutError() {
		"use strict";
		$(".error_msg").fadeOut(6750);
	}

	// Initialize Form Toggle
	function initializeFormToggle() {
		"use strict";
		// Set FORM_TOGGLE based on any existing cookies
		if ($.cookie('form_toggle') !== "undefined") {
			if ($.cookie('form_toggle') === "false") {
				FORM_TOGGLE = false;
			} else {
				FORM_TOGGLE = true;
			}
		}
		// Set up page based on Form_Toggle
		if (FORM_TOGGLE) {
			$("#login").hide();
			$("#signup")._show();
			$("#swap_forms").html("Login");
		} else {
			$("#signup").hide();
			$("#login")._show();
			$("#swap_forms").html("Sign Up");
		}
		// Click handlers and image effect functions
		enableFormToggle();
		fadeOutError();
		saveToggleOnSubmit();
	}

	// Alias a public init function
	this.init = initializeFormToggle;
};
