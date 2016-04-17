'use strict'
const Assimilator = require('../')
const Hoek = require('hoek')
const Forger = require('forger')
const defaults = {
	server: {
		env: "development",
		host: "localhost",
		port: 8080
	},
	settings: {
		globals: {
			path: __dirname
		},
		theme: {
			path: './themes/assimilator',
			layout: 'default'
		},
		blog: {
			path: './blog.second-site.com/',
			series: {
				listAsCategory: false,
				longTitle: true,
				longTitleDelimiter: ' '
			}
		},
		pages: {
			path: './pages/'
		},
		files: {
			index: ['index.html', 'index.htm'],
			path: './projects/'
		}
	},
	context: {
		title: 'My personal site',
		menu: {
			main: [
				{ label: 'about', url: '/about' },
				{ label: 'contact', url: '/contact' },
				{ label: 'project-demo', url: '/project-demo' }
			]
		},
		// font awesome based icons
		social: [
			{ channel: 'twitter', url: 'https://twitter.com/IndieForger' },
			{ channel: 'tumblr', url: 'https://www.tumblr.com/blog/indieforger' },
			{ channel: 'youtube', url: 'https://www.youtube.com/channel/UCWPbP_gp1lUk46wMiIGoXAQ' },
			{ channel: 'github', url: 'https://github.com/indieforger' },
			{ channel: 'google-plus', url: 'https://plus.google.com/b/103153982100921182774/103153982100921182774' },
			{ channel: 'facebook', url: 'https://www.facebook.com/indieforger' }
		]
	}
}

const config1 = Hoek.clone(defaults)
config1.server.port = 9001
config1.settings.blog.path = './blog.first-site.com/'
config1.context.title =  'First personal site'

const config2 = Hoek.clone(defaults)
config2.server.port = 9002
config2.settings.blog.path = './blog.second-site.com/'
config2.context.title =  'Second personal site'

function startServer(config, next) {
	new Assimilator
		.Server(config)
		.start().then((server) => {
			console.log('Server started at: ' + server.info.uri + ' SUCCESS')
			next()
		}).catch((err) => {
			next(err)
		})
}

Forger
	.sequence(
		(next) => startServer(config1, next),
		(next) => startServer(config2, next)
	)
	.then(() => console.log('All servers started'))
	.catch((error) => console.error(error))
