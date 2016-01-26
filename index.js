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
		path: 'blog'
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

	config.blog.url = server.info.uri

	server.views({
		engines: {
			hbs: handlebars
		}, context: config.blog,
		relativeTo: __dirname,
		path: config.theme.path,
		layoutPath: path.join(config.theme.path, 'layout'),
		helpersPath: path.join(config.theme.path, 'helpers'),
		partialsPath: path.join(config.theme.path, 'partials'),
		layout: 'default'
	})

	let routes = []

	routes.push({
		method: 'GET',
		path: '/{uri*}',
		handler: function (request, reply) {
			let uri = request.params.uri || ''
			let locations = [
				path.join(config.files.path, uri),
				path.join(config.theme.path, uri)
			]

			fsSniff.file(locations, { index: config.files.index }).then((file) => {
				if (file.stats.isFile()) {
					// render static file
					return reply.file(file.path)
				}
			}).catch(function (err) {
				let articlePath = path.join(config.blog.path, uri)
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
						return reply.view('category', {
							category: findCategory(uri),
							text: JSON.stringify(findCategory(uri), null, 2)
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

/*
fsSniff
	.list(config.blog.path, {type: 'dir', depth: 2})
	.then((list) => {
		console.log(JSON.stringify(list, null, 2))
	})

*/
generateCategories(config.blog.path)
	.then((categories) => {
		config.blog.categories = categories
		//console.log(JSON.stringify(categories, null, 2))
		server.start(function () {
			console.log('Server started at: ' + server.info.uri)
		});
})

function findCategory(uri) {
	let traverseCategories = function(uri, categories) {
		let category = null
		let subcategory = null
		let index = 0
		while (index < categories.length) {
			category = categories[index]
			if (category.uri === uri) return category
			if (category.hasCategories) {
				subcategory = traverseCategories(uri, category.categories)
				if (subcategory != null) return subcategory
			}
			index ++
		}
		return null
	}

	return traverseCategories(uri, config.blog.categories)
}

function generateCategories(location) {
	let categoryFromTree = function(dirTree) {
		let dirArr = dirTree instanceof Array ? dirTree : [dirTree]
		return dirArr.map((dirObj) => {
			try {
				let uri = dirObj.uri.replace(/^blog\//, '')
				return {
					name: dirObj.name,
					uri: uri,
					hasArticles: dirObj.files.length > 0,
					articles: dirObj.files,
					hasCategories: (dirObj.dirs.length > 0),
					categories: categoryFromTree(dirObj.dirs)
				}
			} catch (err) {
				console.log(err)
				throw new Error(err)
			}
		})
	}

	return new Promise((resolve, reject) => {
		return fsSniff
			.tree(location, {depth: 10})
			.then((dirTree) => {
				resolve(categoryFromTree(dirTree.dirs))
			}).catch((error) => {
				reject(error)
			})
	})
}