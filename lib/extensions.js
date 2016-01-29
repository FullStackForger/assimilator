module.exports = {
	version: '1.0.0'
}

String.prototype.slugToCamel = function () {
	return this.replace(/(^[a-z])|(\-[a-z])/g, function($1) { return $1.toUpperCase().replace('-',' ') });
}

String.prototype.toCamelCase = function() {
	return this
		.replace(/^(.)/, function($1) { return $1.toLowerCase() })
		.replace(/(^.)|(\s.)/g, function($1) { return $1.toUpperCase() })
}