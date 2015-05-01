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

var Convo = Backbone.Model.extend({
	urlRoot: '/feed/convo',
	options: {
		'sendTime': false,
	},
	
	url: function () {
		'use strict';
		var _id, url_to_return = this.urlRoot, time_to_check;
		_id = this.attributes['id'];

		!_id ? _id = this.attributes["user_targ"] : undefined;

		url_to_return = [url_to_return, _id.toString()].join('/');
		
		if (this.options['sendTime']) {
			time_to_check = this.attributes['time_initiated'];
			url_to_return = [url_to_return, "currentTime="].join('?');
			url_to_return = [url_to_return, time_to_check].join("");
			this.options['sendTime'] = false;
		}
		return url_to_return;
	},

	fetch: function (options) {
		this.options['sendTime'] = true;
		return Backbone.Model.prototype.fetch.apply(this, options);
	}
	
});