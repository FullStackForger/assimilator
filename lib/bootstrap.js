'use strict'

const
	path = require('path'),
	registry = require('./registry'),
	helpers = require('./helpers')

module.exports = {
	getTasks: getTasks
}

// returns object with task methods
// each method has method(next) signature
function getTasks (settings, context) {
	let task = {}

	task.indexCategories = function (next) {
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

	task.indexArticles = function (next) {
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

	task.indexArticleTags = function (next) {
		let tagIndex = {}
		context.tags = context.tags instanceof Array ? context.tags : []
		process.stdout.write('Indexing article tags...\t');
		let untagged = []
		context.articles.forEach((article) => {
			if (!article.tags || article.tags.length === 0) {
				untagged.push(article.uri)
				return
			}

			article.tags.forEach((tag) => {
				if (!tagIndex[tag]) {
					let tagObj = {
						name: tag,
						slug: tag.toSlug(),
						articles: [article]
					}
					context.tags.push(tagObj)
					tagIndex[tag] = tagObj
				} else {
					tagIndex[tag].articles.push(article)
				}
			})
		})

		let status = untagged.length === 0 ? 'done' : 'warn'
		process.stdout.write('[ ' + status +' ]\n');
		if (untagged.length > 0) {
			console.log('\nTotal of ' + untagged.length + ' untagged articles have been found:')
			untagged.forEach((article) => console.log('  > ' + article))
			console.log('')
		}


		context.tags.forEach((tag) => {
			let ratio = (tag.articles.length / context.articles.length)
			tag.ratio = Math.round(ratio * 10)
		})


		//console.log(context.tags)
		next()
	}

	task.updateCategoryArticles = function (next) {
		let filesToArticles = function (categories) {
			categories.forEach((category) => {
				category.articles = []
				category.articleFiles.forEach(function(articleFile) {
					let categoryUriStr = category.uri
					if (categoryUriStr.slice(-1) !== '/') categoryUriStr += '/'
					categoryUriStr += articleFile.replace(/.md/, '')
					let article = helpers.findArticle(categoryUriStr, context.articles)
					if (article) category.articles.push(article)
				})
				if (category.categories) {
					category.categories = filesToArticles(category.categories)
				}
			})
			return categories
		}
		context.tags = context.tags instanceof Array ? context.tags : []
		process.stdout.write('Updating category articles...\t');
		context.categories = filesToArticles(context.categories)
		next()
	}

	return task
}

