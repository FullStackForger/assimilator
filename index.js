'use strict';

const
	Hapi = require('hapi'),
	Hoek = require('hoek'),
	Showdown  = require('showdown'),
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
	let _config = config

	this.internal = {}
	registerServer(config)
	return {
		 start: () => {
			 return startServer(_config)
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

		config.context.url = server.info.uri

		let themePath = path.resolve(config.settings.globals.path, config.settings.theme.path, 'theme')
		let themeConfig = require(themePath).config
		themeConfig.context = Hoek.applyToDefaults(themeConfig.context, config.context)
		// expose to global config
		config.context = themeConfig.context

		server.views(themeConfig)

		let routes = []

		routes.push({
			method: 'GET',
			path: '/',
			handler: function (requestm, reply) {
				return reply.view('index')
			}
		})

		routes.push({
			method: 'GET',
			path: '/{uri*}',
			handler: function (request, reply) {

				let uri = request.params.uri || ''
				let rootPath = config.settings.globals.path
				let referrer = url.parse(request.info.referrer).pathname;

				let locations = [
					path.join(rootPath, config.settings.files.path, uri),
					path.join(rootPath, config.settings.theme.path, uri)
				]

				if (referrer) {
					// patch: uses referrer to prevent errors for uris with missing trailing fwd. slash
					locations.unshift(path.join(rootPath, config.settings.files.path, referrer, uri))
					// todo: request redirection would be better
				}

				function renderMarkdown(filePath) {
					// render markdown
					fs.readFile(filePath, 'utf8', function (err, data) {
						if (err) console.console.log(err);
						return reply.view('post', {
							text: markdown.makeHtml(data)
						})
					})
				}

				function renderCategory(uri) {
					// render list sub-categories and posts
					let categoryData =  core.findCategory(uri, config.context.categories)
					return reply.view('category', {
						category: categoryData,
						text: JSON.stringify(categoryData, null, 2)
					})
				}

				forger.failover(
					(complete) => {
						fsSniff.file(locations, { index: config.settings.files.index }).then((file) => {

							if (file.stats.isFile()) {
								// render static file
								reply.file(file.path)
								complete(true)
							}
						}).catch(() => complete(null))
					},
					(complete) => {
						// look for a blog markdown file
						let articlePath = path.join(rootPath, config.settings.blog.path, uri)
						fsSniff.file(articlePath, { ext: '.md', type: 'any' }).then((file) => {
							if (file.stats.isFile()) {
								renderMarkdown(file.path)
								complete(true)
							} else if (file.stats.isDirectory()) {
								renderCategory(uri)
								complete(true)
							}
							complete(null)
						}).catch(() => complete(null))
					},
					(complete) => {
						// look for page markdown files
						let pagePath = path.join(rootPath, config.settings.pages.path, uri)
						fsSniff.file(pagePath, { ext: '.md', type: 'file' }).then((file) => {
							renderMarkdown(file.path)
							complete(true)
						}).catch((err) => {
							reply('<h1>404</h1><h3>File not found</h3>', error).code(404)
							complete(null)
						})
					}
				)
			}
		})
		server.route(routes)
	})
}


function startServer(config) {

	return new Promise((resolve, reject) => {

		// run setup sequence
		forger.sequence(

			(next) => {
				let blogPath = path.resolve(config.settings.globals.path, config.settings.blog.path)
				process.stdout.write('Indexing categories...\t\t');

				core.indexCategories(blogPath).then((categories) => {
					config.context.categories = categories
					process.stdout.write('[ done ]\n');
					//console.log(JSON.stringify(categories, null, 2))
					next()
				}).catch((err) => {
					process.stdout.write('[ error ]\n');
					console.log(err)
					next(err)
				})
			},

			(next) => {
				let blogPath = path.resolve(config.settings.globals.path, config.settings.blog.path)
				process.stdout.write('Indexing articles...\t\t');

				core.indexArticles(blogPath).then((articles) => {
					process.stdout.write('[ done ]\n');
					//console.log(JSON.stringify(articles, null, 2))
					config.context.articles = articles
					next()
				}).catch((err) => {
					process.stdout.write('[ error ]\n');
					console.log(err)
					next(err)
				})
			}

		).then(() => {
			server.start(function () {
				console.log('Server started at: ' + server.info.uri)
				resolve()
			})

		}).catch((err) => reject(err))
	})
}