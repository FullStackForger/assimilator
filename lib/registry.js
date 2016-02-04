'use strict'
const
	path = require('path'),
	fsSniff = require('fs-sniff'),
	myhead = require('myhead'),
	forger = require('forger')

const core = module.exports = {
	indexArticles: indexArticles,
	indexCategories: indexCategories
}

function indexArticles(location) {
	return new Promise((resolve, reject) => {
		fsSniff
			.list(location, { type: 'file', depth: 10 })
			.then((list) => {

				let parsed = 0
				let articles = []
				forger.doWhile((next) => {

					let filePath = list[parsed]
					let fullPath = path.join(location, filePath)
					let filename = path.basename(fullPath, '.md')
					let uri = filePath
						.replace(/.md/, '')
						.replace(/\\/g, '/')

					parsed++
					if (uri.search(/-draft(\/|$)/) != -1) return next()

					myhead.readFrom(fullPath).then((data) => {

						data = data || {}
						data.filePath = fullPath
						data.uri = uri
						data.tags = data.tags || []

						if (!data.tags instanceof Array) data.tags = [data.tags]

						// convert filename to camel cased string if title not present
						data.title = data.title ? data.title.toCamelCase() : filename.slugToCamel()
						articles.push(data)
						next()
					}).catch((err) => {
						next(err)
					})
				}, () => {
					return parsed < list.length
				}).then(() => {
					resolve(articles)
				}).catch((error) => {
					reject(error)
				})

			}).catch((err) => {
				reject(error)
			})
	})
}

function indexCategories(location) {
	let depth = 0
	let categoryFromTree = function (dirTree) {
		depth ++
		let dirTreeArr = dirTree instanceof Array ? dirTree : [dirTree]
		let retTreeArr = []
		dirTreeArr.forEach((dirObj) => {
			try {

				let categories = dirObj.dirs.length > 0 ? categoryFromTree(dirObj.dirs) : []
				let draft = dirObj.name.search(/-draft$/) > -1
				let hasArticles = dirObj.files.length > 0
				let hasCategories = categories.length > 0
				let empty = !hasArticles && !hasCategories

				// filter out empty categories
				let cat, i = 0
				if (categories.length > 0) {
					while (!empty && i < categories.length) {
						cat = categories[i]
						empty = cat.empty ? cat.empty : empty
						i++
					}
				}

				if (!empty && !draft) retTreeArr.push({
					name: dirObj.name,
					uri: dirObj.uri,
					hasArticles: hasArticles,
					hasCategories: hasCategories,
					empty: empty,
					articleFiles: dirObj.files,
					files: dirObj.files,
					dirs: dirObj.dirs,
					categories: categories
				})

			} catch (err) {
				throw new Error(err)
			}
		})
		depth--
		return retTreeArr;
	}

	return new Promise((resolve, reject) => {
		return fsSniff
			.tree(location, { depth: 10, rootPrefix: false })
			.then((dirTree) => {
				resolve(categoryFromTree(dirTree.dirs))
			}).catch((error) => {
				reject(error)
			})
	})
}
