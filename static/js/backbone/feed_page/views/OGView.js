var OGView = Backbone.View.extend({

	el: '#og_content',

	template: _.template($('#other_gardener_template').html()),

	events: {

	},

	render: function () {
		return this
	},

	initialize: function (attrs, opts) {
		'use strict';

		// Initialize collecton
		this.collection = new OtherGardeners(OTHER_GARDENERS);
		// For each model in collection, append the template
		// to the parent element
		this.collection.each(_.bind(function (model) {
			var context;
			context = model.attributes;
			console.log(context);
			console.log(this.template(context));
			this.$el.append(this.template(context));
		}, this));
	},
	

});