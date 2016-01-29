'use  strict'
const
	Handlebars = require('handlebars')

var
	theme = module.exports = {}


theme.config = {
	engines: {
		hbs: Handlebars
	},
	context: {
		theme: {
			created: 'January 2016',
			name: 'Assimilator',
			author: 'IndieForger'
		}
	},
	relativeTo: __dirname,
	//relativeTo: './demo/themes/assimilator',
	path: './',

	layoutPath: './layout',
	helpersPath: './helpers',
	partialsPath: './partials',
	layout: 'default'
}
