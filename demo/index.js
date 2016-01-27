'use strict'
const Assimilator = require('../')
const config = {
	rootPath: __dirname,
	blog: {
		title: 'My personal site',
		menu: {
			main: [
				{ label: 'menu 1', url: 'http://localhost:8080/user/marek' },
				{ label: 'menu r', url: 'http://localhost:8080/some/random/url/api.js?param1=ala&param2=ole' },
				{ label: 'menu 2', url: 'http://localhost:8080/user/marek/nah' }
			]
		},
		tags: ['blog', 'writing', 'engine', 'hapijs'],
		path: 'blog'
	},
	files: {
		index: ['index.html', 'index.htm'],
		path: 'pages/'
	},
	theme: {
		path: 'themes/assimilator'
	}
}

new Assimilator
	.Server(config)
	.start(() => {
		console.log('successful')
	})