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
		debug: { request: ['error'] },
		app: config
	})

	this.internal = {}
	server.connection({
		port: Number(config.server.port || 8080),
		host: config.server.host
	});

	registerServer(server)
	return {
		start: () => {
			return startServer(server)
		}
	}

}


function registerServer(server) {
	let config = server.settings.app
	server.log(['error', 'database', 'read']);

	server.register([
		require('vision'),
		require('inert')
	], (err) => {

		Hoek.assert(!err, err)

		config.context.url = server.info.uri

		// setup theme
		let themeJSPath = path.resolve(config.settings.globals.path, config.settings.theme.path, 'theme')
		let themeConfig = require(themeJSPath).config
		themeConfig.context = Hoek.applyToDefaults(themeConfig.context, config.context)
		config.context = themeConfig.context
		server.views(themeConfig)

		// setup routes
		server.route(routes.generate())
	})
}


function startServer(server) {
	let config = server.settings.app
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
					resolve(server)
				})

			}).catch((err) => reject(err))
	})
}
