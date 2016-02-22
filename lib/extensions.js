module.exports = {
	version: '1.0.0'
}

String.prototype.toSlug = function () {
	'use strict'
	return this.toLowerCase()
		.replace(/\s+/g, '-')           // Replace spaces with -
		.replace(/[^\w\-]+/g, '')       // Remove all non-word chars
		.replace(/\-\-+/g, '-')         // Replace multiple - with single -
		.replace(/^-+/, '')             // Trim - from start of text
		.replace(/-+$/, '')             // Trim - from end of text
}

String.prototype.slugToCamel = function () {
	'use strict'
	return this.replace(/(^[a-z])|(\-[a-z\d])/g, function($1) {
		return $1.toUpperCase().replace('-',' ')
	})
}

String.prototype.toCamelCase = function() {
	'use strict'
	return this
		.replace(/^(.)/, function($1) { return $1.toLowerCase() })
		.replace(/(^.)|(\s.)/g, function($1) { return $1.toUpperCase() })
}