var Convos = Backbone.Collection.extend({
	urlRoot: "http://" + window.location.hostname + ":8002/convo",
	options: {},
	url: function () {
		var base;
		base = this.urlRoot;
		if (_.has(this.options, 'timestamp')) {
			base = [
				base,
				"?clientTime=",
				this.options['timestamp'],
				"&user=",
				USER
			].join("");
			delete this.options['timestamp'];
		}
		return base;
	},
	fetch: function (options) {
		if (options['timestamp']) {
			this.options['timestamp'] = options['timestamp']; 
		}
		return Backbone.Collection.prototype.fetch.apply(this, options);
	},
	parse: function (JSONres) {
		return JSONres['convos'];
	},
	model: Convo
});