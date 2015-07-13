var PlantImgView = Backbone.View.extend({
	
	current_slide: 0,

	template: _.template($("#plant-img-template").html()),

	events: {
		"change input[name='plant-img']": "_addImage",
		"click .add-plant-img": "_triggerFileInput",
		"click .rem-plant-img": "_removeImage",
	},

	// @desc: Sets interval for updating the plant images
	// @params: None
	// @res: Void
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
	 	var slick_idx, slick_obj, model_num;
	 	slick_obj = this.$el.find(".img-carousel")
	 						.slick("getSlick");

	 	if (options["idx"]) {
	 		slick_idx = options["idx"];
	 	} else {
	 		model_num = model.attributes["id"].toString();
	 		slick_idx = slick_obj.$slides
	 							 .filter(".c-i-w-" + model_num)
	 							 .index() - 1;
	 	}

	 	slick_idx = (slick_idx < 0 ? 0 : slick_idx);

	 	this.$el
	 		.find(".img-carousel")
			.slick("slickRemove", slick_idx);

		if (collection.length < 1) {
			this.$el
				.find(".img-carousel")
				.slick("slickAdd", ['<div class="carousel-img-wrapper ',
						 'img-place-holder">',
						 '<img class="carousel-img"',
						 ' src="https://plantappstorage.s3.',
						 'amazonaws.com/static/img/user_blan',
						 'k_image.png"/></div>'].join(""));

			this.$el.find(".rem-plant-img")
					.css("opacity", "0.5")
					.attr("disabled", "disabled");
		}
	},

	// @desc: UI function, removes image from collection
	// @params: None
	// @res: Void
	_removeImage: function () {
		var _id, slick_obj, $target_slide, isConfirmed;

		isConfirmed = confirm('Delete this plant picture?');
		if (isConfirmed) {
			slick_obj = this.$el.find(".img-carousel")
								.slick("getSlick");
			this.current_slide = this.$el.find(".img-carousel")
										 .slick("slickCurrentSlide");

			$target_slide = $(slick_obj.$slides[this.current_slide]);
			_id = $target_slide.children(".carousel-img")
					    	   .attr("id")
							   .replace(/p-img-/g, "");

			this.collection.get(_id)
						   .destroy({idx: this.current_slide});
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
		var context, replace_img;
		// Remove the place-holder once you have stuff in the collection
	 	if (this.$el.find(".img-place-holder").length > 0) {
	 		this.$el.find(".img-carousel")
	 				.slick("slickRemove", 0);
	 	}

	 	// Start with a context object cloned from the model
		context = _.clone(model.attributes);
		context["preloaded"] = PRELOADER;
		// Add template to carousel
		this.$el.find(".img-carousel")
				.slick("slickAdd", this.template(context));
	 	
	 	// Create a replacement image with all the appropriate attrs
	 	replace_img = document.createElement("img");
	 	replace_img.setAttribute("id", "p-img-" + context['id'].toString());
	 	replace_img.setAttribute("src", context["imageURL"]);
	 	replace_img.className += " carousel-img";

	 	// After 3 second delay...
		setTimeout(_.bind(function () {
			var slick_obj, $target;
			// Target the image and replace the target with the replacement
			slick_obj = this.$el.find(".img-carousel")
								.slick("getSlick");
			$target = $(slick_obj.$slides[collection.length - 1]);
			$target = $target.children(".carousel-img");
			$target.replaceWith(replace_img);
			// Re-set the position
			this.$el.find(".img-carousel").slick("setPosition");
			// Re-enable Img Delete Button if there's more than 1 img in collection
			if (collection.length > 0) {
				this.$el.find(".rem-plant-img")
						.removeAttr("style")
						.removeAttr("disabled");
			}
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
			adaptiveHeight: true,
			variableWidth: true,
			dots: true,
		});
		// Callback, setting Object's current slide to the currentSlide
		this.$el.find(".img-carousel")
				.on("afterChange", _.bind(function (event, slick, currentSlide) {
					this.current_slide = currentSlide;
				}, this));
	},

	// @desc: Initialize function (created whenever new Plant is created)
	// @params: JS Object, JS Object
	// @res: Void
	initialize: function (attrs, opts) {
		this.parent = attrs['parent'];
		this.el = attrs['el'];
		this.plant_id = opts['plant_id'];
		this.collection = attrs['collection'];
		this._initializePlantCarousel();

		// Set default condition of button
		if (this.collection.length < 1) {
			this.$el.find(".rem-plant-img")
					.css("opacity", "0.5")
					.attr("disabled", "disabled");
		}

		// Event Listeners
		this.listenTo(this.collection, "add", this._addImageUI);
		this.listenTo(this.collection, "remove", this._removeImageUI);

		this._updatePlantImg();

	}
});