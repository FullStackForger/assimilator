const
	Showdown  = require('showdown'),
	fs = require('fs'),
	url = require('url'),
	path = require('path'),
	forger = require('forger'),
	fsSniff = require('fs-sniff'),
	helpers = require('./helpers'),
	findCategory = helpers.findCategory,
	markdown = new Showdown.Converter({
		tables: true,
		strikethrough: true,
		ghCodeBlocks: true,
		tasklists: true
	})

var
	handlers = {},
	settings = {},
	context = {}

handlers.indexHandler = function (request, reply) {
	'use strict'
	return reply.view('index')
}

handlers.tagHandler = function (request, reply) {
	"use strict";
	return reply.view('index', {
		articles: helpers.findTagArticles(request.params.tag, context.tags)
	})
}

handlers.routeHandler = function (request, reply) {
	'use strict'

	let uri = request.params.uri || ''
	let rootPath = settings.globals.path
	let referrer = url.parse(request.info.referrer).pathname;

	let locations = [
		path.join(rootPath, settings.files.path, uri),
		path.join(rootPath, settings.theme.path, uri),
		path.join(rootPath, settings.blog.path, uri)
	]

	if (referrer) {
		// patch: uses referrer to prevent errors for uris with missing trailing fwd. slash
		locations.unshift(path.join(rootPath, settings.files.path, referrer, uri))
		// todo: request redirection would be better
	}

	function renderMarkdown(filePath) {
		return new Promise((resolve, reject) => {
			fs.readFile(filePath, 'utf8', function (err, data) {
				if (err) {
					console.console.log(err)
					reject(err)
				}
				resolve(markdown.makeHtml(data))
			})
		})
	}


	function renderCategory(uri) {
		return new Promise((resolve, reject) => {
			// render list sub-categories and posts
			try {
				resolve(findCategory(uri, context.categories))
			} catch (err) {
				reject(err)
			}
		})

	}

	forger.failover(

		(complete) => {
			// look for a static file
			fsSniff.file(locations, { index: settings.files.index }).then((file) => {
				if (file.stats.isFile()) {
					reply.file(file.path)
					complete(true)
				}
			}).catch(() => complete(null))
		},

		(complete) => {
			// look for a blog markdown file or a category directory
			let articlePath = path.join(rootPath, settings.blog.path, uri)
			fsSniff.file(articlePath, { ext: '.md', type: 'any' }).then((file) => {
				if (file.stats.isFile()) {
					renderMarkdown(file.path).then((mdHtml) => {
						let article = {}
						article.text = mdHtml
						article.meta = helpers.findArticle(uri, context.articles)
						reply.view('post', { article: article })
						complete(true)
					}).catch((err) => complete(null))
				} else if (file.stats.isDirectory()) {
					renderCategory(uri).then((categoryData) => {
						reply.view('category', { category: categoryData });
						complete(true)
					}).catch((err) => complete(null))
				}
			}).catch(() => complete(null))
		},

		(complete) => {
			// look for page markdown files
			let pagePath = path.join(rootPath, settings.pages.path, uri)
			fsSniff.file(pagePath, { ext: '.md', type: 'file' }).then((file) => {
				renderMarkdown(file.path).then((mdHtml) => {
					// todo: consider changing post->page in new 'page' layout
					let article = {}
					article.text = mdHtml
					article.meta = helpers.findArticle(uri, context.articles)
					reply.view('post', { article: article })
					complete(true)
				}).catch(() => complete(null))
			}).catch((err) => complete(null))
		}
	).catch((err) => {
			console.log()
			console.log(new Error('route ' + request.url.pathname + ' couln\'t be resolved'))
			// render 404 if none has been found
			reply('<h1>404</h1><h3>File not found</h3>').code(404)
	})
}

module.exports = {
	generate: function generate(fSettings, fContext) {
		'use strict'
		let routes = []

		settings = fSettings
		context = fContext

		routes.push({
			method: 'GET',
			path: '/',
			handler: handlers.indexHandler
		})

		routes.push({
			method: 'GET',
			path: '/tag/{tag}',
			handler: handlers.tagHandler
		})

		routes.push({
			method: 'GET',
			path: '/{uri*}',
			handler: handlers.routeHandler
		})

		return routes
	}
}