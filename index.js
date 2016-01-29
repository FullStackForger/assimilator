'use strict';

const
	Hapi = require('hapi'),
	Hoek = require('hoek'),
	path = require('path'),
	util = require('util'),
	fs = require('fs'),
	fsSniff = require('fs-sniff'),
	forger = require('forger'),
	core = require('./lib/core'),
	routes = require('./lib/routes'),
	server = new Hapi.Server({
		debug: {
			request: ['error']
		}
	})

//new Assimilator.Server(config).start(callback)
const Assimilator = module.exports = {}

Assimilator.Server = function (config) {
	if (!config) console.error('Config is missing')

	this.internal = {}
	registerServer(config)
	return {
		 start: () => {
			 return startServer(config)
		 }
	}
}

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

		// setup theme
		let themePath = path.resolve(config.settings.globals.path, config.settings.theme.path, 'theme')
		let themeConfig = require(themePath).config
		themeConfig.context = Hoek.applyToDefaults(themeConfig.context, config.context)
		config.context = themeConfig.context
		server.views(themeConfig)

		// setup routes
		let srvRoutes = routes.generate(config.settings, config.context)
		console.log(srvRoutes)
		server.route(srvRoutes)
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