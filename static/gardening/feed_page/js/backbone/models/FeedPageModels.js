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
	save: function (arguments) {
		this.url = this.setURL();
		return Backbone.Model.prototype.save.apply(this, arguments);
	},
	fetch: function (arguments) {
		this.url = this.setURL();
		return Backbone.Model.prototype.fetch.apply(this, arguments);
	},
	setURL: function () {
		if (this.attributes['id']){
			return 'jobs/' + this.attributes['id'];
		}
		return 'jobs/'
	},
	_fetchComments: function () {
		this.interval = setInterval(_.bind(function () {
			this.fetch();
		}, this), 10000);
	},
	initialize: function () {
		this._fetchComments();
	} 
});

var Comment = Backbone.Model.extend({
	url: 'comments/'
});

