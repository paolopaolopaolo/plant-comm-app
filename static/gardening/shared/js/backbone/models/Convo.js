var Convo = Backbone.Model.extend({
	urlRoot: '/convo',
	options: {
		'sendTime': false,
	},
	
	url: function () {
		'use strict';
		var _id, url_to_return = this.urlRoot, time_to_check;
		
		_id = this.attributes['id'];

		_id === undefined ? _id = this.attributes["user_targ"] : undefined;

		url_to_return = [url_to_return, _id.toString()].join('/');
		
		if (this.options['sendTime']) {
			time_to_check = this.attributes['time_initiated'];
			url_to_return = [url_to_return, "currentTime="].join('?');
			url_to_return = [url_to_return, time_to_check].join("");
			this.options['sendTime'] = false;
		}
		return url_to_return;
	},

});