'use strict'
const Assimilator = require('../')
const config = {
	server: {
		env: "production",
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
			//path: '../../blog.indieforger.com'
			path: './blog/',
			series: {
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
			{ channel: 'facebook', url: 'https://www.facebook.com/indieforger' },
			/*
			{ channel: 'steam', url: '' }
			{ channel: 'reddit', url: '' }
			{ channel: 'android', url: '' }
			{ channel: 'apple', url: '' }
			{ channel: 'instagram', url: '' }
			{ channel: 'linkedin', url: '' }
			{ channel: 'send', url: '' }
			{ channel: 'rss', url: '' }
			 */
		]
	}
}

new Assimilator
	.Server(config)
	.start().then(() => {
		//console.log('successful')
	}).catch((err) => {
		console.log(err)
	})
