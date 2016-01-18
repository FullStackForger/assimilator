'use strict';


const
	Hapi = require('hapi'),
	Hoek = require('hoek'),
	Showdown  = require('showdown'),
	path = require('path'),
	util = require('util'),
	handlebars = require('handlebars'),
	fs = require('fs'),
	fsSniff = require('fs-sniff'),
	url = require('url'),
	server = new Hapi.Server(),
	markdown = new Showdown.Converter({
		tables: true,
		strikethrough: true,
		ghCodeBlocks: true,
		tasklists: true
	})


const config = {
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
		path: 'blog/'
	},
	files: {
		index: ['index.html', 'index.htm'],
		path: 'pages/'
	},
	theme: {
		path: 'themes/assimilator'
	}
}

server.connection({
	port: Number(process.argv[2] || 8080),
	host: 'localhost'
});

server.register([
		require('vision'),
		require('inert')
	], (err) => {

	Hoek.assert(!err, err)

	server.views({
		engines: {
			html: handlebars
		},
		context: config.blog,
		relativeTo: __dirname,
		path: config.theme.path,
		layoutPath: path.join(config.theme.path, 'layout'),
		layout: 'default'
		//helpersPath: 'views/helpers',
		//partialsPath: 'views/partials'
	})

	let routes = []

	routes.push({
		method: 'GET',
			path: '/{uri*}',
			handler: function (request, reply) {
			let uri = request.params.uri || ''
			let filePath = path.resolve(config.files.path, uri);

			//console.log('====================================')
			//console.log(util.inspect(request, { depth: 2 }));
			//console.log('pathname', request.url.pathname)
			//console.log('referrer', request.info.referrer)

			fsSniff.file(filePath, { index: config.files.index }).then((file) => {
				console.log('file')
				return reply.file(file.path)
			}).catch(function () {
				let articlePath = path.resolve(config.blog.path, uri)
				fsSniff.file(articlePath, { ext: '.md' }).then((file) => {
					fs.readFile(file.path, 'utf8', function (err, data) {
						if (err) console.log(err);
						return reply.view('index', {
							text: markdown.makeHtml(data)
						})
					});
				}).catch(function (error) {
					console.log('error')
					return reply('<h1>404</h1><h3>File not found</h3>', error).code(404)
				})
			})
		}
	})

	server.route(routes)
})



server.start(function () {
	console.log('Server started at: ' + server.info.uri)
});