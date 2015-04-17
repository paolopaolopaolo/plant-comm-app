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
	initialize: function () {
		this.set({'profile_pic': [
									DOMAIN,
									"media/",
									this.attributes['profile_pic']
								].join("")}, {silent: true});
	}
});