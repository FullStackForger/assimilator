// https://futurestud.io/blog/how-to-create-and-use-custom-handlebars-helpers-with-hapi
var json = module.exports = function(obj) {
	return JSON.stringify(obj, null, 2);
}

module.exports = json;