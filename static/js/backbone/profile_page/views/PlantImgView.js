var PlantImgView = Backbone.View.extend({

	start_drag: undefined,
	end_drag: undefined,
	current_pos: 0,
	curr_width: 0,
	curr_idx: 0,
	startup: true,
	plantimginterval: undefined,

	template: _.template($('#plantpic_thumb_template').html()),

	events: {
		"click .fake_button": "triggerInput",
		"change input[type='file']" : "addImg",
		"click .img_left": "moveLeft",
		"click .img_right": "moveRight",
		"click .delete_img": "delImg",
		'touchstart .plantpic_thumb': '_recordStartDrag',
		'touchend .plantpic_thumb': '_recordEndDragAndCalculate',
	},

	_recordStartDrag: function (event) {
		this.start_drag = event.originalEvent.changedTouches[0]['clientX'];
	},

	_recordEndDragAndCalculate: function (event) {
		var diff;
		this.end_drag = event.originalEvent.changedTouches[0]['clientX'];
		diff = this.end_drag - this.start_drag;
		if (Math.pow(diff, 2) >= 25) {
			if (diff > 0) {
				this.moveLeft();
			} else if (diff < 0){
				this.moveRight();
			}
		}
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
			img_to_delete = this.collection
								.last(this.collection.length)[this.curr_idx];
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
		this.margin_r = 5;
	},

	_setPosition: function (left_or_right) {
		var current_width;
		// establish current width
		this.findWidth();
		current_width = this.curr_width;
		 // + (this.margin_r);
		// Set current position based on left_or_right
		if (left_or_right === 'left') {
			this.current_pos = this.current_pos - current_width;
			// make position wrap around
			if (this.current_pos < 0 && this.collection.length > 0) {
				this.current_pos = current_width * (this.collection.length - 1);
			} else if (this.collection.length < 1) {
				this.current_pos = 0;
			}
		} else if (left_or_right === 'right') {
			this.current_pos = this.current_pos + current_width;
			if (this.current_pos > current_width * (this.collection.length - 1) ) {
				this.current_pos = 0;
			}

		}
	},

	_moveToPosition: function () {
		this.$el.find(".plantpic_thumb").animate({
				"left" :  "-" + this.current_pos.toString() + "px"
		});	
	},

	_resetIndex: function (left_or_right) {
		if (left_or_right === 'left') {
			if (this.curr_idx > 0) {
				this.curr_idx -= 1;
			} else if (this.curr_idx === 0){
				if (this.collection.length > 0) {
					this.curr_idx = this.collection.length - 1;
				}
			}
		} else if (left_or_right === 'right') {
			if (this.curr_idx < this.collection.length - 1) {
				this.curr_idx += 1;
			} else {
				this.curr_idx = 0;
			}
		}
		console.log('Current position:');
		console.log(this.current_pos);
		console.log('Current index:');
		console.log(this.curr_idx);
	},

	//Move plant pictures left
	moveLeft: function () {
		this._setPosition('left');
		this._moveToPosition();
		this._resetIndex('left');
	},

	// Move plant pictures right
	moveRight: function () {
		this._setPosition('right');
		this._moveToPosition();
		this._resetIndex('right');
	},

	// Render images
	render: function (model) {
		var context, url_to_render;
		context = _.clone(model.attributes);
		this.toggleArrowDisplay();

		if (context['imageURL'].indexOf("http") < 0) {
			url_to_render = [
								window.location.protocol,
								"//",
								window.location.hostname,
								(window.location.port ? ":" + window.location.port : ""),
								'/media/',
								context['imageURL']
							].join('');
		} else {
			url_to_render = context['imageURL'];
		}
		context['imageURL'] = url_to_render;

		if (this.$el.find('.plantpic_thumb').length === 0) {
			this.$el.prepend(this.template(context));
		} else {
			this.$el.find('.plantpic_thumb')
					.last()
					.after(this.template(context));
		}
		// Whenever an image is rendered, set index and position to the last spot
		// and move to that position
		this.findWidth();
		this.curr_idx = this.collection.length - 1;
		this.current_pos = (this.curr_width) * (this.collection.length - 1);
		this._moveToPosition();
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
			 	// alert('problems deleting image ' + _id.toString());
			 	this.$el.find(['#ppt', _id.toString()].join(''))
			 			.detach();

			 }, this))
			 .done(_.bind(function () {
			 	this.$el.find(['#ppt', _id.toString()].join(''))
			 			.detach();
			 }, this));
	},

	// Periodically fetch images
	intervalFetch: function (milli) {
		this.plantimginterval = setInterval(_.bind(function () {
			this.collection.fetch();
		}, this), milli);
	},

	// Initialize callback behaviors
	initialize: function (attrs, opts) {
		var newline_stripped_html; 
		this.plant_id = attrs['plant_id'];
		this.collection.each(_.bind(function (model) {
			this.render(model);
		}, this));
		this.toggleArrowDisplay();
		this.listenTo(this.collection, 'remove', this.destroyImg);
		this.listenTo(this.collection, 'add', this.render);
		this.curr_idx = 0;
		this.current_pos = 0;
		// this._moveToPosition();
		this.intervalFetch(10000);
	}
});