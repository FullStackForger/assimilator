'use strict'
const Assimilator = require('../')
const config = {
	settings: {
		globals: {
			path: __dirname
		},
		theme: {
			path: './themes/assimilator',
			layout: 'default'
		},
		blog: {
			path: './blog/'
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
		}
	}
}

new Assimilator
	.Server(config)
	.start().then(() => {
		//console.log('successful')
	}).catch((err) => {
		console.log(err)
	})