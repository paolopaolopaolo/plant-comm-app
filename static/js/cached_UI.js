// Cached Variables and Functions

// An encapsulated LandingPage object
// Carries all the required interactivity
// for the landing page 
function LandingPage($) {
	// Cached variable
	var FORM_TOGGLE,
	    TOGGLE_READY;

	FORM_TOGGLE = true;
	TOGGLE_READY = true;

	// Set jQuery instance to noConflict
	$ = $.noConflict(true);

	// jQuery plugin, _show, that removes dynamic
	// styling after calling show function
		$.fn._show = function () {
		var $this = this;
		$this.show({ 
			complete: function () {
				$this.removeAttr('style');
			} 
		});
	};

	// Toggles the form between the 
	// signup and login forms, given a 
	function toggleForm(formval) {
		"use strict";
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
		enableFormToggle();
		$('#login').hide();
		fadeOutError();
	}

	// Alias a public init function
	this.init = initializeFormToggle;
}




