'use strict';

const
	Hapi = require('hapi'),
	Hoek = require('hoek'),
	path = require('path'),
	util = require('util'),
	fs = require('fs'),
	fsSniff = require('fs-sniff'),
	forger = require('forger'),
	extensions = require('./extensions'),
	bootstrap = require('./bootstrap'),
	registry = require('./registry'),
	routes = require('./routes');

//new Assimilator.Server(config).start(callback)
const Assimilator = module.exports = {}



Assimilator.Server = function (config) {
	if (!config) return console.error('Config is missing')

	let server = new Hapi.Server({
		debug: { request: ['error'] }
	})

	this.internal = {}
	server.connection({
		port: Number(config.server.port || 8080),
		host: config.server.host
	});

	registerServer(server, config)
	return {
		start: () => {
			return startServer(server, config)
		}
	}

}


function registerServer(server, config) {

	server.log(['error', 'database', 'read']);

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
		server.route(srvRoutes)
	})
}


function startServer(server, config) {
	return new Promise((resolve, reject) => {

		let setupTasks = bootstrap.getTasks(config.settings, config.context)
		forger.sequence(
			setupTasks.indexCategories,
			setupTasks.indexArticles,
			setupTasks.indexArticleTags,
			setupTasks.updateCategoryArticles
		).then(() => {
				console.log('parsing complete')
				server.start(function () {
					console.log('Server started at: ' + server.info.uri)
					resolve()
				})

			}).catch((err) => reject(err))
	})
}
