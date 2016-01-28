'use strict'
const
	path = require('path'),
	fsSniff = require('fs-sniff'),
	myhead = require('myhead'),
	forger = require('forger')

const core = module.exports = {
	findCategory: findCategory,
	indexArticles: indexArticles,
	indexCategories: indexCategories
}

function findCategory (uri, categories) {
	let category = null
	let subcategory = null
	let index = 0
	while (index < categories.length) {
		category = categories[index]
		if (category.uri === uri) return category
		if (category.hasCategories) {
			subcategory = findCategory(uri, category.categories)
			if (subcategory != null) return subcategory
		}
		index ++
	}
	return null
}

function indexArticles(location) {
	return new Promise((resolve, reject) => {
		console.log('\n\n indexArticles()')

		fsSniff
			.list(location, { type: 'file', depth: 10 })
			.then((list) => {

				let parsed = 0
				let articles = []
				forger.doWhile((next) => {

					let filePath = list[parsed]
					let fullPath = path.join(location, filePath)
					let filename = path

					myhead.readFrom(fullPath).then((data) => {

						data = data || {}

						data.path = filePath
						data.tags = data.tags || []
						if (!data.tags instanceof Array) data.tags = [data.tags]

						// convert filename to camel cased string if title not present
						data.title = data.title || filename.replace(/-([a-z])/g, function (g) {
							return g[1].toUpperCase();
						})
						articles.push(data)

						parsed++
						next()
					}).catch((err) => {
						next(err)
					})
				}, () => {
					return parsed < list.length
				}).then(() => {
					console.log('done')
					resolve(articles)
				}).catch((error) => {
					console.log('------err')
					console.log('err', error.stack)
					reject(error)
				})

			}).catch((err) => {
				reject(error)
			})
	})
}

function indexCategories(location) {
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
			.tree(location, { depth: 10 })
			.then((dirTree) => {
				resolve(categoryFromTree(dirTree.dirs))
			}).catch((error) => {
				reject(error)
			})
	})
}