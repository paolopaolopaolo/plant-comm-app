// OtherGardener model carries all the information
// about other gardeners based on their own input
var OtherGardener = Backbone.Model.extend({
	urlRoot: '/feed/gardener/',
	url: function () {
		'use strict';
		var _id;
		_id = model.attributes['id'];
		return [this.urlRoot, _id.toString()].join('');
	},
});


var Event = Backbone.Model.extend({
	url: 'events/'
});

var Job = Backbone.Model.extend({
	url: 'jobs/'
});