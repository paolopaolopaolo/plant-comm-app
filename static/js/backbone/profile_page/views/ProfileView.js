var ProfileView = Backbone.View.extend({

	// Cached variables
	FORM_TOGGLE: true,
	cancel_render: false,
	refetchInterval: undefined,


	// Set target element
	el: '#profile_form',

	// Events/Event Handler hash
	events: {
		"click #toggle_edits": "toggleEditable",
		"change input[type!='file'], textarea, select": "saveText",
		"change input[type='file']": "saveImg"
	},

	// Takes a model attribute (str) and links it
	// to the corresponding jQueried input 
	attrToInput: function (string) {
		string = "#id_" + string;
		return this.$el.find(string);
	},

	// Populate an Object with key value pairs pulled from the page
	inputToAttr: function (selector, ResultObj) {
		console.log(selector);
		if (selector !== "#id_available") {
			// If the selector is not the checkbox input, set value
			ResultObj[selector.slice(4)] = this.$el.find(selector).val();
		} else {
			// If the selector is the checkbox input, set checked property
			ResultObj[selector.slice(4)] = this.$el.find(selector)
												   .prop("checked");
		}
		return ResultObj;
	},

	// Makes text inputs readonly
	toggleEditable: function () {
 		if (!this.FORM_TOGGLE) {
  			this.initialConditions();
  			this.model.set(this.model.attributes, {silent: true});
  			this.model.save(this.model.attributes);
  			this.getFromOthers(5000);
 		} else {
  			this.$el.find('input, textarea').removeAttr('readonly');
  			this.$el.find('input').removeAttr('disabled');
  			this.$el.find('select').removeAttr('disabled');
  			this.$el.find('input, textarea, select').removeAttr('style');
  			this.$el.find('li').removeAttr('style');
  			this.$el.find('label').removeAttr('style');
  			$('#toggle_edits').html('Save Profile');
  			clearInterval(this.refetchInterval);
 		}
 		this.FORM_TOGGLE = !this.FORM_TOGGLE;
	},


	// Handles text changes
	saveText: function (event) {
		"use strict";
		console.log('saveText called');
		var $currentValue, result;
		// Initialize result object
		result = {};
		// Get event target
		$currentValue = $(event.currentTarget);
		result = this.inputToAttr("#" + $currentValue.attr("id"), result);
		// Save the model and re-render it on the page
		this.model.set(result);	
		if (JSON.stringify(this.model.attributes) === JSON.stringify(this.model.previousAttributes())) {
			this.render(this.model);
		}
	},

	// Handles img changes with its own AJAX call
	saveImg: function (event) {
		// Hoist variables
		console.log('saveImg called');
		var xhr_object, fake_form;
		// Create the xhr object to send
		// method: POST
		// url: /profile/

		fake_form = document.createElement('form');
		fake_form.setAttribute('enctype', 'multipart/form-data');

		xhr_object = {
			'url' : '/profile/gardener/pic',
			'method' : 'POST',
			'contentType': false,
			'processData': false,
			'data': new FormData(fake_form)
		};

		xhr_object['data'].append('profile_pic', event.target.files[0]);

		// Send AJAX POST request; on finish, change the image
		$.ajax(xhr_object).done(_.bind(function (response) {
			this.cancel_render = true;
			this.model.set({'profile_pic': response['profile_pic']});
		}, this));
	},

	// Profile picture rendered
	profilePicRender: function (model) {
		var url_to_render;
		console.log('ppRender called!');
		if (model.attributes['profile_pic'].indexOf('http') > -1) {
			url_to_render = model.attributes['profile_pic'].replace(/https:\/{1}/g, "https://");
			$('#profilepic_thumb').attr('src', url_to_render);
		} else {
			if (model.attributes['profile_pic'] !== "") {
				url_to_render = [ window.location.protocol,
								  "//",
								  window.location.hostname,
								  (window.location.port ? ":" + window.location.port : ""),
								  '/media/',
								  model.attributes['profile_pic']].join('');
				$('#profilepic_thumb').attr('src', url_to_render);
			}
		}
	},

	// Just find the appropriate inputs and replace them with server-generated
	// values
	render: function (model) {
		var key, response;
		// Ignore if cancel_render is true
		if (!this.cancel_render) {
			// Set response to the current model attr
			response = this.model.attributes;
			// Save the model to server
			this.model.save(response)
					  .error(_.bind(function (resp) {
					  		// if there is an error, do the following
						  	var error_msg;
						  	function error_msg(str) {
						  		return [
		  									'<span class="error_msg"',
		  									' style="color:red;font-size:12px;">',
		  									str,
		  									' Fix this before continuing.'
						  				].join("");
						  	}
						  	// The backend has two possible restrictions
						  	// on Profile Inputs

						  	// 1) If the zipcode is too long, this resets the zipcode 
					  		// 	  to be the first five characters
						  	if (_.has(resp.responseJSON, "zipcode")) {
						  		this.model.set({'zipcode': $('#id_zipcode').val().slice(0, 5)});
						  	} 
						  	// 2) If the username is taken, highlight the username field
					  		// 	  with background and message
						  	if (_.has(resp.responseJSON, "username")) {
						  		$("#id_username").addClass('invalid_input');
						  		// Limit the number of error messages that can be
						  		// after the input
						  		if ($("#id_username").next(".error_msg").length === 0) {
						  			$("#id_username").after(error_msg(resp.responseJSON["username"]));
						  		}
						  	}
					  	}, this))
					  .done(_.bind(function () {
					  	// If input is successful, remove all invalid_input stylings
					  	$('#id_username').removeClass('invalid_input');
					  	// Detach all error messages
					  	this.$el
					  		.find('.error_msg')
					  		.detach();
					  }, this));
			
			$('.profile_content p').fadeIn();
			
			// For each item in the model, set
			// the corresponding input to the model's value
			for (key in response) {	
				if (key !== 'available' && key !== 'profile_pic') {
					this.attrToInput(key).val(response[key]);
					if (key === 'first_name') {
						this.$el.find('h2')
								.html(response[key]+ "'s Profile");
						$('title').html(response[key] + "'s Gardening Profile");
					}
				} else if( key === 'available') {
					this.attrToInput(key).prop('checked', response[key]);
				}
			}
			$('.profile_content p').fadeOut();
		}
		this.cancel_render = false;
		return this;
	},

	// initial conditions
	initialConditions: function () {
		// Hide 'Saved!' message
		$(".profile_content p").hide();
		// Disable select input 
		this.$el
			.find('select')
			.attr('disabled', 'disabled');

		// Disable checkboxes
		this.$el
			.find('input[type="checkbox"]')
			.attr('disabled', 'disabled');

		// Make input, text areas, and select fields readonly
		this.$el
			.find('input, textarea, select')
			.attr('readonly', 'readonly')
	   		.css({
				'background-color':'transparent',
				'border': 'none',
			});

	   	// Hide li wrapper of file input
		this.$el
			.find('input[type="file"]')
			.parent()
			.hide();

		// Hide the label of the profile pic 
		this.$el
			.find('label[for="id_profilepic"]')
			.hide();

		// Toggle button says "Edit Profile"
		$('#toggle_edits').html('Edit Profile');

		$('#id_profilepic').removeClass(".hideCheckbox");
	},

	// An interval function that repeatedly fetches from the 
	// DB whenever something changes.
	getFromOthers: function (milli) {
		this.refetchInterval = setInterval(_.bind(function () {
			console.log('ProfileView fetch');
			this.model.fetch();
		}, this), milli);
	},

	// Initial site render
	initialize: function () {
		// Initialize all the gobbledygook
		this.initialConditions();
		// Set up new model
		this.model = new Gardener(PROFILE_SOURCE);
		// Render the profile text
		this.render(this.model);
		// Render the profile picture
		this.profilePicRender(this.model);
	
		// set event listener for model saving/re-rendering
		this.listenTo(this.model, "change", this.render);
		this.listenTo(this.model, "change:profile_pic", this.profilePicRender);
	}
});