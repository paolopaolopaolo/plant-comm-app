var ProfileView = Backbone.View.extend({

	// Cached toggle value for toggling text editing
	FORM_TOGGLE: true,
	cancel_render: false,

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
			// If the selector is the checkbox input, set property
			ResultObj[selector.slice(4)] = this.$el.find(selector)
												   .prop("checked");
		}
		return ResultObj;
	},

	// Makes text inputs readonly
	toggleEditable: function () {
 		if (!this.FORM_TOGGLE) {
  			this.initialConditions();
  			this.model.save(this.model.attributes);
 		} else {
  			this.$el.find('input, textarea').removeAttr('readonly');
  			this.$el.find('input').removeAttr('disabled');
  			this.$el.find('select').removeAttr('disabled');
  			this.$el.find('input, textarea').removeAttr('style');
  			this.$el.find('li').removeAttr('style');
  			this.$el.find('label').removeAttr('style');
  			$('#toggle_edits').html('Save Profile');
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
		console.log(result);	
		// Save the model and re-render it on the page
		this.model.set(result);
		
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

	profilePicRender: function (model) {
		var url_to_render;
		console.log('ppRender called!');
		if (model.attributes['profile_pic'].indexOf('http') === 0) {
			$('#profilepic_thumb').attr('src', model.attributes['profile_pic']);
		} else {
			url_to_render = [ window.location.protocol,
							  "//",
							  window.location.hostname,
							  (window.location.port ? ":" + window.location.port : ""),
							  '/media/',
							  model.attributes['profile_pic']].join('');
			console.log(url_to_render);
			$('#profilepic_thumb').attr('src', url_to_render);
		}
	},

	// Just find the appropriate inputs and replace them with server-generated
	// values
	render: function (model) {
		var key, response;
		if (!this.cancel_render) {
			response = this.model.attributes;
			console.log(this.model.attributes);
			this.model.save(response);
			
			$('.profile_content p').fadeIn();
			
			// For each item in the model, set
			// the corresponding input to the model's value
			for (key in response) {	
				if (key !== 'available' && key !== 'profile_pic') {
					this.attrToInput(key).val(response[key]);
				} else if( key === 'available') {
					this.attrToInput(key).prop('checked', response[key]);
				}
			}
			$('.profile_content p').fadeOut();
		}
		this.cancel_render = false;
		return this;
	},

	// inital conditions
	initialConditions: function () {
		// Hide 'Saved!' message
		$(".profile_content p").hide();
		// Disable select/checkbox input and make text inputs readonly
		this.$el.find('select').attr('disabled', 'disabled');
		this.$el.find('input[type="checkbox"]').attr('disabled', 'disabled');
		this.$el.find('input, textarea').attr('readonly', 'readonly')
								   		.css({
											'background-color':'transparent',
											'border': 'none',
										});
		this.$el.find('input[type="file"]').parent().hide();
		this.$el.find('label[for="id_profilepic"]').hide();
		// Toggle button says "Edit Profile"
		$('#toggle_edits').html('Edit Profile');
		$('#id_profilepic').removeClass(".hideCheckbox");
	},

	// An interval function that repeatedly fetches from the 
	// DB whenever something changes.
	getFromOthers: function (milli) {
		setInterval(_.bind(function () {
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
		// Render the model
		this.render(this.model);

		// Set interval to ask for changes
		this.getFromOthers(5000);

		// set event listener for model saving/re-rendering
		this.listenTo(this.model, "change", this.render);
		this.listenTo(this.model, "change:profile_pic", this.profilePicRender);
	}
});