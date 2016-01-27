'use strict';

const
	Hapi = require('hapi'),
	Hoek = require('hoek'),
	Showdown  = require('showdown'),
	Handlebars = require('handlebars'),
	path = require('path'),
	util = require('util'),
	fs = require('fs'),
	url = require('url'),
	fsSniff = require('fs-sniff'),
	forger = require('forger'),
	core = require('./lib/core'),
	server = new Hapi.Server({
		debug: {
			request: ['error']
		}
	}),
	markdown = new Showdown.Converter({
		tables: true,
		strikethrough: true,
		ghCodeBlocks: true,
		tasklists: true
	})


//new Assimilator.Server(config).start(callback)
const Assimilator = {}
Assimilator.Server = function (config) {
	if (!config) console.error('Config is missing')
	this.internal = {}
	registerServer(config)
	return {
		 start: () => {
			 startServer(config)
		 }
	}
}

module.exports = Assimilator;

server.connection({
	port: Number(process.argv[2] || 8080),
	host: 'localhost'
});

function registerServer(config) {
	server.register([
			require('vision'),
			require('inert')
		], (err) => {

		Hoek.assert(!err, err)

		config.blog.url = server.info.uri

		server.views({
			engines: {
				hbs: Handlebars
			}, context: config.blog,
			relativeTo: config.rootPath,
			path: config.theme.path,
			layoutPath: path.join(config.theme.path, 'layout'),
			helpersPath: path.join(config.theme.path, 'helpers'),
			partialsPath: path.join(config.theme.path, 'partials'),
			layout: 'default'
		})

		let routes = []

		routes.push({
			method: 'GET',
			path: '/',
			handler: function (requestm, reply) {
				return reply.view('index', {
					text: 'index'
				})
			}
		})

		routes.push({
			method: 'GET',
			path: '/{uri*}',
			handler: function (request, reply) {

				let uri = request.params.uri || ''
				let locations = [
					path.join(config.rootPath, config.files.path, uri),
					path.join(config.rootPath, config.theme.path, uri)
				]

				fsSniff.file(locations, { index: config.files.index }).then((file) => {
					if (file.stats.isFile()) {
						// render static file
						return reply.file(file.path)
					}
				}).catch(function (err) {
					let articlePath = path.join(config.rootPath, config.blog.path, uri)
					fsSniff.file(articlePath, { ext: '.md' }).then((file) => {
						if (file.stats.isFile()) {
							// render markdown
							fs.readFile(file.path, 'utf8', function (err, data) {
								if (err) console.log(err);
								return reply.view('post', {
									text: markdown.makeHtml(data)
								})
							})
						} else if (file.stats.isDirectory()) {
							// render list sub-categories and posts
							let categoryData =  core.findCategory(uri, config.blog.categories)
							return reply.view('category', {
								category: categoryData,
								text: JSON.stringify(categoryData, null, 2)
							})
						}

					}).catch(function (error) {
						reply('<h1>404</h1><h3>File not found</h3>', error).code(404)
					})
				})
			}
		})

		server.route(routes)
	})
}

function startServer(config) {
	return new Promise((resolve, reject) => {
		forger.parallel(
			(complete) => {
				console.log('Indexing categories...')
				let blogPath = path.resolve(config.rootPath, config.blog.path)
				core.indexCategories(blogPath).then((categories) => {
					config.blog.categories = categories
					//console.log(JSON.stringify(categories, null, 2))
					complete()
				}).catch((err) => complete(err))
			}
		).then(() => {
			server.start(function () {
				console.log('Server started at: ' + server.info.uri)
			})
			resolve()
		}).catch((err) => reject(err))
	})
}