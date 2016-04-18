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

function indexArticles(settings, location) {
	return new Promise((resolve, reject) => {
		fsSniff
			.list(location, { type: 'file', depth: 10 })
			.then((list) => {

				let parsed = 0;
				let articles = [];
				forger.doWhile((next) => {

					let filePath = list[parsed];
					let fullPath = path.join(location, filePath);
					let filename = path.basename(fullPath, '.md');
					let uri = filePath
						.replace(/.md/, '')
						.replace(/\\/g, '/');
					let uriParts = uri.split('/');

					parsed++;
					if (uri.search(/-draft(\/|$)/) != -1) return next();

					myhead.readFrom(fullPath).then((data) => {

						data = data || {};
						data.filePath = fullPath;
						data.uri = uri;
						data.tags = data.tags || [];

						if (!data.tags instanceof Array) data.tags = [data.tags];

						if (data.title) {
							data.title = data.title;
						} else {
							data.title = filename;
							// parse series long article title
							let isSeries = uri.search(/-series\/.[\w\d-]*$/) > -1;
							if (isSeries && settings.series && settings.series.longTitle) {
								let titleCategory = uriParts[uriParts.length - 2];
								let delimiter = settings.series && settings.series.longTitleDelimiter
									? settings.series.longTitleDelimiter : ' ';
								data.title = titleCategory.slice(0, -7) + delimiter + data.title;   // removes '-series'
							}
							// convert filename to camel cased string if title not present
							data.title = data.title.slugToCamel()
						}

						articles.push(data);
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

function indexCategories(settings, location) {
	let depth = 0
	let categoryFromTree = function (dirTree) {
		depth ++
		let dirTreeArr = dirTree instanceof Array ? dirTree : [dirTree]
		let retTreeArr = []
		dirTreeArr.forEach((dirObj) => {
			try {
				if (dirObj.name.search(/-draft$/) > -1) return

				let categoryDirs = []
				let seriesDirs = []
				dirObj.dirs.forEach(function(subDir) {
					if (subDir.name.search(/-series$/) > -1) {
						seriesDirs.push(subDir)
					} else {
						categoryDirs.push(subDir)
					}
				})

				let categories = categoryDirs.length > 0 ? categoryFromTree(categoryDirs) : []
				let series = seriesDirs.length > 0 ? categoryFromTree(seriesDirs) : []
				let hasArticles = dirObj.files.length > 0
				let hasCategories = categories.length > 0
				let hasSeries = series.length > 0
				let empty = !hasArticles && !hasCategories && !hasSeries

				// filter out empty categories
				let cat, i = 0
				if (categories.length > 0) {
					while (!empty && i < categories.length) {
						cat = categories[i]
						empty = cat.empty ? cat.empty : empty
						i++
					}
				}

				let leafName =  dirObj.name.search(/-series$/) > -1
					? dirObj.name.slice(0, -7).slugToCamel()  // removes '-series'
					: dirObj.name.slugToCamel()

				let leaf = {
					name: leafName,
					uri: dirObj.uri,
					hasArticles: hasArticles,
					hasCategories: hasCategories,
					hasSeries: hasSeries,
					empty: empty,
					articleFiles: dirObj.files,
					series: series,
					categories: categories
				}

				if (!empty) retTreeArr.push(leaf)

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
