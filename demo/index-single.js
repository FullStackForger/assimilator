'use strict';
const Assimilator = require('../');
const config = {
	env: 'development',
	site: {
		connection: {
			host: 'localhost',
			port: 8080,
			name: 'default'
		},
		rootPath: './',
		path: './blog.first-site.com',
		theme: {
			path: './themes/assimilator',
			layout: 'default'
		},
		pages: {
			path: './pages/'
		},
		files: {
			index: ['index.html', 'index.htm'],
			path: './projects/'
		},
		series: {
			listAsCategory: false,
			longTitle: true,
			longTitleDelimiter: ' '
		},
		context: {
			title: 'My personal site',
			menu: {
				main: [
					{label: 'about', url: '/about'},
					{label: 'contact', url: '/contact'},
					{label: 'project-demo', url: '/project-demo'}
				]
			},
			// font awesome based icons
			social: [
				{channel: 'twitter', url: 'https://twitter.com/IndieForger'},
				{channel: 'tumblr', url: 'https://www.tumblr.com/blog/indieforger'},
				{channel: 'youtube', url: 'https://www.youtube.com/channel/UCWPbP_gp1lUk46wMiIGoXAQ'},
				{channel: 'github', url: 'https://github.com/indieforger'},
				{channel: 'google-plus', url: 'https://plus.google.com/b/103153982100921182774/103153982100921182774'},
				{channel: 'facebook', url: 'https://www.facebook.com/indieforger'}
			]
		}
	}
};

Assimilator
	.start(config)
	.then((server) => {
		server.connections.forEach((connection) => {
			console.log(`Server started at: ${connection.info.uri}`);
		});
	}).catch((err) => {
		console.log(err.stack)
	});