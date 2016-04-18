'use strict';
const Hapi = require('hapi');
const Hoek = require('hoek');
const Path = require('path');
const util = require('util');
const fs = require('fs');
const fsSniff = require('fs-sniff');
const forger = require('forger');
const extensions = require('./extensions');
const bootstrap = require('./bootstrap');
const registry = require('./registry');
const routes = require('./routes');

const AssimilationBox = {};
AssimilationBox.register = function (server, options, next) {
	server.ext('onRequest', function (request, reply) {
		// todo: add support for favicon.ico (multisite) > request.path === /favicon.ico

		request.app.site = options;
		reply.continue();
	});
	next();
};
AssimilationBox.register.attributes = {
	name: 'assimilationBox'
};

const defaults = {
	context: {
		title: 'Assimilator'
	}
};

//new Assimilator.Server(config).start(callback)
const Assimilator = module.exports = {};

Assimilator.parseConfig = function (configOptions) {
	const options = Hoek.clone(configOptions);
	const sites = [];

	if (configOptions.site) {
		Hoek.merge(defaults, configOptions.site);
	}

	if (configOptions.sites && configOptions.sites instanceof Array) {
		configOptions.sites.forEach((siteConfig) => {
			sites.push(Hoek.applyToDefaults(defaults, siteConfig));
		});
	}

	if (sites.length === 0) {
		sites.push(defaults);
	}

	options.parsed = true;
	options.sites = sites;
	return options;
};

Assimilator.register = function (server, configOptions, next) {
	if (!configOptions.parsed) configOptions = Assimilator.parseConfig(configOptions);

	const plugins = configOptions.sites.map((pluginOptions) => {
		return {
			register: AssimilationBox,
			options: pluginOptions,
			select: new Array(pluginOptions.connection.name)
		}
	});

	plugins.unshift(require('vision'));
	plugins.unshift(require('inert'));
	server.register(plugins, (err) => {
		Hoek.assert(!err, err);

		try {
			const themeJSPath = Path.resolve(configOptions.site.rootPath, configOptions.site.theme.path, 'theme');
			const themeConfig = require(themeJSPath).config;
			themeConfig.context = Hoek.applyToDefaults(themeConfig.context, defaults.context);

			server.views(themeConfig);
			server.route(routes.generate());
		} catch (err) {
			return next(err);
		}
		next();
	});
};

Assimilator.register.attributes = {
	pkg: require('../package.json'),
	multiple: true
};





Assimilator.start = function ( config ) {
	return new Promise((resolve, reject) => {
		const server = new Hapi.Server();
		if (!config.parsed) {
			config = Assimilator.parseConfig(config);
		}

		// todo: move to configuration
		server.log(['error', 'database', 'read']);

		// adding connection from inside of a plugin is a tricky part,
		// read: https://github.com/hapijs/hapi/issues/2754
		config.sites.forEach((siteOptions) => {
			server.connection({
				port: siteOptions.connection.port,
				host: siteOptions.connection.host,
				labels:new Array(siteOptions.connection.name)
			});
		});

		server.register({ register: Assimilator,  options: config }, (err) => {
			if(err) return reject(err);

			// todo: move to configuration
			// server.on('request-error', (request, err) => {
			// 	console.log('Error response (500) sent for request: ' + request.id + ' because: ' + err.message);
			// 	console.log(err.stack);
			// });

			server.start((err) => {
				if(err) return reject(err);
				resolve(server);
			});
		});
	});
};


////////////////////


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
