'use strict';

const Path = require('path')
const Hapi = require('hapi')
const Hoek = require('hoek')

const handlebars = require('handlebars')

const server = new Hapi.Server()

const config = {
	blog: {
		title: 'My personal site',
		menu: [
			{ label: 'menu 1', url: 'http://localhost:8080/user/marek' },
			{ label: 'menu r', url: 'http://localhost:8080/some/random/url/api.js?param1=ala&param2=ole' },
			{ label: 'menu 2', url: 'http://localhost:8080/user/marek/nah' }
		],
		tags: ['blog', 'writing', 'engine', 'hapijs']
	},
	theme: {
		path: 'themes/default'
	}
}

server.connection({
	port: Number(process.argv[2] || 8080),
	host: 'localhost'
});

server.register(require('vision'), (err) => {

	Hoek.assert(!err, err)

	server.views({
		engines: {
			html: handlebars
		},
		context: config.blog,
		relativeTo: __dirname,
		path: config.theme.path
	})

	server.route({
		method: 'GET',
		path: '/{uri*}',
		handler: function (request, reply) {
			console.log(request.params)
			console.log(request.query)
			reply.view('index', {
				body: JSON.stringify(request.params)
			})
		}
	})

	server.route({
		method: 'GET',
		path: '/user/{name}',
		handler: function (request, reply) {
			console.log(request.params)
			console.log(request.query)
			reply.view('index', {
				body: JSON.stringify(request.params)
			})
		}
	})
})


server.start();