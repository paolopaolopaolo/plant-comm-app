var PlantImgView = Backbone.View.extend({
	
	current_idx: 0,
	template: _.template($("#plant-img-template").html()),

	events: {
		"change input[name='plant-img']": "_addImage",
		"click .add-plant-img": "_triggerFileInput",
		"click .rem-plant-img": "_removeImage",
		"click .slick-prev": "_idxSubtract",
		"click .slick-next": "_idxAdd",
	},


	// @desc: In response to collection removal, destroys the model
	// 		  and then removes it from the carousel
	_removeImageUI: function (model, collection, options) {
		model.destroy()
			 .done(_.bind(function () {
			 	this.$el
			 		.find(".img-carousel")
					.slick("slickRemove", options["idx"]);
				this.current_idx--;
			 }, this));
		
	},

	// @desc: UI function, removes image from collection
	// @params: None
	// @res: Void
	_removeImage: function () {
		var _id;
		_id = $(this.$el
		  	  		.find([
		  	  			".carousel-img-wrapper",
		  	  			":not(.img-place-holder)"
		  	  		].join(""))[this.current_idx + 1]);
		_id = _id.children(".carousel-img").attr("id");
		_id = _id.replace(/p-img-/g, "");
		this.collection.remove(_id, {idx: this.current_idx});
	},

	// @desc: UI function, subtracts the current_idx, which is used
	// 		  to identify which picture the carousel is currently on.
	// @params: None
	// @res: Void
	_idxSubtract: function () {
		if (this.current_idx > 0) {
			this.current_idx--;
		} else {
			this.current_idx = this.collection.length - 1;
		}
	},

	// @desc: UI function, adds the current_idx, which is used
	// 		  to identify which picture the carousel is currently on.
	// @params: None
	// @res: Void
	_idxAdd: function () {
		if (this.current_idx < this.collection.length -1) {
			this.current_idx++;
		} else {
			this.current_idx = 0;
		}
	},

	// @desc: UI function, triggers the file input functionality
	// @params: Event Object
	// @res: Void
	_triggerFileInput: function (event) {
		event.preventDefault();
		$(event.currentTarget).siblings("input[name='plant-img']").trigger("click");
	},

	// @desc: Adds image to carousel and goes to that image
	// @params: Backbone Model Object, Backbone Collection Object
	// @res: Void
	_addImageUI: function (model, collection) {
		this.$el.find(".img-carousel")
				.slick("slickAdd", this.template(model.attributes));
		this.$el.find(".img-carousel")
				.slick("slickGoTo", this.collection.length - 1);
		this.current_idx = this.collection.length - 1;
	},

	// @desc: UI Function, loads the image file and gets a usable link 
	// 		  once POST request is answered
	// @params: Event object
	// @res: Void
	_addImage: function (event) {
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
		 	// Remove the place-holder once you have stuff in the collection
		 	if (this.$el.find(".img-place-holder").length > 0) {
		 		this.$el.find(".img-carousel")
		 				.slick("slickRemove", 0);
		 	}
		 }, this));
	},

	// @desc: Initialize a Slick Image Carousel for the plant images
	// @params: None
	// @res: Void
	_initializePlantCarousel: function () {
		this.$el.find(".img-carousel").slick({
			accessibility: true,
			infinite: true,
			adaptiveHeight: true,
			variableWidth: true,
		});
	},

	// @desc: Renders all images in the collection
	// @params: None
	// @res: Void
	render: function () {
		this.collection.each(_.bind(function (model) {
			this._addImageUI(model.attributes);
		}));
	},

	initialize: function (attrs, opts) {
		this.parent = attrs['parent'];
		this.el = attrs['el'];
		this.plant_id = opts['plant_id'];
		this.collection = attrs['collection'];
		// this.render();
		this._initializePlantCarousel();

		// Event Listeners
		this.listenTo(this.collection, "add", this._addImageUI);
		this.listenTo(this.collection, "remove", this._removeImageUI);


	}
});