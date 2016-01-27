'use strict'
const
	fsSniff = require('fs-sniff')

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
		fsSniff
			.list(config.blog.path, { type: 'file', depth: 10 })
			.then((list) => {
				console.log(JSON.stringify(list, null, 2))
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