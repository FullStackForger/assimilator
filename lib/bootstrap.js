'use strict'

const
	path = require('path'),
	registry = require('./registry')

module.exports = {
	getTasks: getTasks
}

// returns object with task methods
// each method has method(next) signature
function getTasks (settings, context) {
	let tasks = {}

	tasks.indexCategories = function (next) {
		let blogPath = path.resolve(settings.globals.path, settings.blog.path)
		process.stdout.write('Indexing categories...\t\t');

		registry.indexCategories(blogPath).then((categories) => {
			context.categories = categories
			process.stdout.write('[ done ]\n');
			//console.log(JSON.stringify(categories, null, 2))
			next()
		}).catch((err) => {
			process.stdout.write('[ error ]\n');
			console.log(err)
			next(err)
		})
	}

	tasks.indexArticles = function (next) {
		let blogPath = path.resolve(settings.globals.path, settings.blog.path)
		process.stdout.write('Indexing articles...\t\t');

		registry.indexArticles(blogPath).then((articles) => {
			process.stdout.write('[ done ]\n');
			//console.log(JSON.stringify(articles, null, 2))
			context.articles = articles
			next()
		}).catch((err) => {
			process.stdout.write('[ error ]\n');
			console.log(err)
			next(err)
		})
	}

	tasks.indexArticleTags = function (next) {
		context.tags = context.tags instanceof Array ? context.tags : []
		context.tagIndex = {}
		process.stdout.write('Indexing article tags...\t');
		context.articles.forEach((article) => {
			context.tags = context.tags.concat( article.tags )
			context.tags.forEach((tag) => {
				let tagObj = context.tagIndex[tag] || []
				tagObj.push(article.uri)
				context.tagIndex[tag] = tagObj
			})
		})
		process.stdout.write('[ done ]\n');
		//console.log(context.tagIndex)
		next()
	}
	return tasks
}

