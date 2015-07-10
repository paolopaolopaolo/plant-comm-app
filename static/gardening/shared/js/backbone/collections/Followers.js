var Followers = Backbone.Collection.extend({
	model: Follow,
	url: "/follow"
});