var PlantImgView = Backbone.View.extend({

	current_pos: 0,
	curr_width: 0,
	curr_idx: 0,
	startup: true,

	template: _.template($('#plantpic_thumb_template').html()),

	events: {
		"click .fake_button": "triggerInput",
		"change input[type='file']" : "addImg",
		"click .img_left": "moveLeft",
		"click .img_right": "moveRight",
		"click .delete_img": "delImg",
	},

	addImg: function (event) {
		var new_image, addImage, fake_form;
		// Create a new plant img object
		new_image = new PlantImg({
						pk: this.plant_id,
						imageURL: ''
					});
		// Set up a virtual multipart/form-data form
		fake_form = document.createElement('form');
		fake_form.setAttribute('enctype', 'multipart/form-data');

		// Set up an addImage POST request
		addImage = {
			url: 'plantimg/',
			method: 'POST',
			processData: false,
			contentType: false,
			data: new FormData(fake_form)
		};
		// Append to data the image and id
		addImage['data'].append(
			'image',
			event.target.files[0]
			);
		addImage['data'].append(
			'id', new_image.attributes['pk']
			)

		// Send, and then reset the new_image to 
		// make it fit to add to collection
		$.ajax(addImage)
		 .done(_.bind(function (response) {
		 	new_image.unset('pk');
		 	new_image.set({
		 		id: response['id'],
		 		imageURL: response['imageURL'],
		 	}, {silent: true});

		 	this.collection.add(new_image);
		 }, this));
	},

	// UI level function, will remove an image from collection
	delImg: function () {
		var img_to_delete, confirmation;
		confirmation = confirm('Delete plant image?');
		if (confirmation) {
			img_to_delete = this.collection.last(this.collection.length)
						   .reverse()[this.curr_idx];
			this.collection.remove(img_to_delete);
		}
	},

	// Misnamed function: controls which UI is visible
	// based on the number of items in collection and
	// whether or not the form is in edit mode
	toggleArrowDisplay: function () {
		// Left and right arrow toggles, if there's
		// less than 2 in the collection, hide the arrows
		if (this.collection.length < 2 || !this.collection.length) {
			this.$el.find('.dir_button')
					.addClass('hidden');
		} else {
			// else, show the arrows
			this.$el.find('.dir_button')
					.removeClass('hidden');
		}
		// hide delete_img button if you have
		// no items in collection and at initial pageload
		if (this.collection.length < 1 || !ppv) {
			this.$el.find('.delete_img')
					.addClass('hidden');
		} else if (ppv) {
			// if ppv has been instantiated, and if
			// ppv.plant_view.FORM_TOGGLE[this.plant_id] is False,
			// show delete button
			if (!ppv.plant_view.FORM_TOGGLE[this.plant_id]) {
				this.$el.find('.delete_img')
						.removeClass('hidden');
			}
		}
		// Move cursor left if the index is above the 
		// highest possible index
		if (this.curr_idx > this.collection.length - 1) {
			this.moveLeft();
		}
	},

	triggerInput: function (event) {
		$(event.currentTarget).parent()
							  .children('input[type="file"]')
							  .trigger('click');
	},

	// simple function that sets the view's current width
	// (vital for finding out how much to move the slider
	// by)
	findWidth: function () {
		this.curr_width = parseInt(this.$el.css('width').replace(/px/g, ""), 10);
	},

	// Move plant pictures left
	moveLeft: function () {
		var current_width;
		// establish current width
		this.findWidth();
		current_width = this.curr_width;
		// Set current position to always subtract
		this.current_pos = this.current_pos - current_width;
		if (this.current_pos < 0 && this.collection.length > 0) {
			this.current_pos = current_width * (this.collection.length - 1);
		} else if (this.collection.length < 1) {
			this.current_pos = 0;
		}
		
		this.$el.find(".plantpic_thumb").animate({
				"left" :  "-" + this.current_pos.toString() + "px"
		});	
		
		if (this.curr_idx > 0) {
			this.curr_idx -= 1;
		} else if (this.curr_idx === 0){
			if (this.collection.length > 0) {
				this.curr_idx = this.collection.length - 1;
			}
		}
		console.log("current idx:" + this.curr_idx.toString());
		console.log("current pos:" + this.current_pos.toString());
	},

	// Move plant pictures right
	moveRight: function () {
		var current_width;
		this.findWidth();
		current_width = this.curr_width;
		// Add the current width to the position
		this.current_pos = this.current_pos + current_width;

		// Upper bound set
		if (this.current_pos > current_width * (this.collection.length - 1) ) {
			this.current_pos = 0;
		}
		// Current index set
		if (this.curr_idx < this.collection.length - 1) {
			this.curr_idx += 1;
		}  else {
			this.curr_idx = 0;
		}
		// Animate the change in left value
		this.$el.find(".plantpic_thumb").animate({
				"left" :  "-" + this.current_pos.toString() + "px"
		});
		// Print the current index
		console.log("current idx:" + this.curr_idx.toString());
		console.log("current pos:" + this.current_pos.toString());
	},

	render: function (model) {
		this.toggleArrowDisplay();
		this.$el.prepend(this.template(model.attributes));
	},

	// Once removed from collection
	// destroy the model (to send it
	// to backend), then detach from DOM 
	destroyImg: function (model) {
		var _id;
		this.toggleArrowDisplay();
		_id = model.attributes['id'];
		// console.log(model.url());
		model.destroy()
			 .error(_.bind(function () {
			 	alert('problems deleting image ' + _id.toString());
			 }, this))
			 .done(_.bind(function () {
			 	this.$el.find(['#ppt', _id.toString()].join(''))
			 			.detach();
			 }, this));
	},

	// Periodically fetch images
	intervalFetch: function (milli) {
		setInterval(_.bind(function () {
			this.collection.fetch();
		}, this), milli);
	},

	// Initialize callback behaviors
	initialize: function (attrs, opts) { 
		this.plant_id = attrs['plant_id'];
		this.collection.each(_.bind(function (model) {
			this.render(model);
		}, this));
		this.toggleArrowDisplay();
		this.listenTo(this.collection, 'remove', this.destroyImg);
		this.listenTo(this.collection, 'add', this.render);
		this.curr_idx = 0;
		this.current_pos = 0;
		this.intervalFetch(10000);
	}
});