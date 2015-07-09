var PlantImgView = Backbone.View.extend({
	
	template: _.template($("#plant-img-template").html()),

	events: {
		"change input[name='plant-img']": "_addImage",
		"click .add-plant-img": "_triggerFileInput",
		"click .rem-plant-img": "_removeImage",
	},

	_updatePlantImg: function () {
		setInterval(_.bind(function () {
			this.collection.fetch({remove: true});
		}, this), 10000);
	},

	// @desc: In response to collection removal, destroys the model
	// 		  and then removes it from the carousel
	// @params: Backbone Model Object, Backbone Collection Object, JS Object
	// @res: Void
	_removeImageUI: function (model, collection, options) {
	 	var slick_idx;
	 	if (options["idx"]) {
	 		this.$el
	 			.find(".img-carousel")
				.slick("slickRemove", options["idx"]);
	 	} else {
		 	this.$el
		 		.find(".img-carousel")
		 		.slick("slickFilter", ":not(.c-i-w-"+ model.attributes["id"] + ")");
	 	}

		if (collection.length < 1) {
			this.$el
				.find(".img-carousel")
				.slick("slickAdd", '<div class="carousel-img-wrapper img-place-holder">
			<img class="carousel-img" src="https://plantappstorage.s3.amazonaws.com/static/img/user_blank_image.png"/>
		</div>');
		}
		
	},

	// @desc: UI function, removes image from collection
	// @params: None
	// @res: Void
	_removeImage: function () {
		var _id, slick_obj, slide_num, $target_slide;

		slick_obj = this.$el.find(".img-carousel")
							.slick("getSlick");

		slide_num = slick_obj.currentSlide;

		$target_slide = $(slick_obj.$slides[slide_num]);
		_id = $target_slide.children(".carousel-img")
				    	   .attr("id")
						   .replace(/p-img-/g, "");

		this.collection.get(_id)
					   .destroy({idx: slide_num});
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
		var context;
		// Remove the place-holder once you have stuff in the collection
	 	if (this.$el.find(".img-place-holder").length > 0) {
	 		this.$el.find(".img-carousel")
	 				.slick("slickRemove", 0);
	 	}

		context = _.clone(model.attributes);
		context["preloaded"] = PRELOADER;
		this.$el.find(".img-carousel")
				.slick("slickAdd", this.template(context));

		setTimeout(_.bind(function () {
			var slick_obj, $target;
			slick_obj = this.$el.find(".img-carousel")
								.slick("getSlick");
			$target = $(slick_obj.$slides[collection.length - 1]);
			$target = $target.children(".carousel-img");
			$target.attr("src", $target.data("original"));
		}, this), 3000);

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
		 }, this));
	},

	// @desc: Initialize a Slick Image Carousel for the plant images
	// @params: None
	// @res: Void
	_initializePlantCarousel: function () {
		this.$el.find(".img-carousel").slick({
			accessibility: true,
			infinite: true,
			// adaptiveHeight: true,
			variableWidth: true,
			dots: true,
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
		this._initializePlantCarousel();

		// Event Listeners
		this.listenTo(this.collection, "add", this._addImageUI);
		this.listenTo(this.collection, "remove", this._removeImageUI);

		this._updatePlantImg();

	}
});