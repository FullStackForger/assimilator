'use  strict'
const
	Handlebars = require('handlebars')

var
	theme = module.exports = {}

// exports server.views config object
// http://hapijs.com/tutorials/views

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
	path: './',

	layoutPath: './layout',
	helpersPath: './helpers',
	partialsPath: './partials',
	layout: 'default'
}
