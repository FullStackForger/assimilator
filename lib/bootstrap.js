'use strict';
const path = require('path');
const registry = require('./registry');
const helpers = require('./helpers');

module.exports = {
	getTasks: getTasks
};

/**
 * Returns object with task methods.
 *  each method has method(next) signature
 * @param site
 * @returns {{}}
 */
function getTasks (site) {
	let task = {};

	task.indexCategories = function (next) {
		let blogPath = path.resolve(site.rootPath, site.path);
		process.stdout.write(`${site.connection.name} > Indexing categories...\t\t\t`);

		registry.indexCategories(site, blogPath).then((categories) => {
			site.context.categories = categories;
			process.stdout.write('[ done ]\n');
			//console.log(JSON.stringify(categories, null, 2))
			next();
		}).catch((err) => {
			process.stdout.write('[ error ]\n');
			console.log(err);
			next(err);
		})
	};

	task.indexArticles = function (next) {
		let blogPath = path.resolve(site.rootPath, site.path);
		process.stdout.write(`${site.connection.name} > Indexing articles...\t\t\t`);

		registry.indexArticles(site, blogPath).then((articles) => {
			process.stdout.write('[ done ]\n');
			//console.log(JSON.stringify(articles, null, 2))
			site.context.articles = articles;
			next()
		}).catch((err) => {
			process.stdout.write('[ error ]\n');
			//console.log(err);
			next(err);
		})
	};

	task.indexArticleTags = function (next) {
		let tagIndex = {};
		site.context.tags = site.context.tags instanceof Array ? site.context.tags : [];
		process.stdout.write(`${site.connection.name} > Indexing articles tags...\t\t`);
		let untagged = [];
		site.context.articles.forEach((article) => {
			if (!article.tags || article.tags.length === 0) {
				untagged.push(article.uri);
				return
			}

			article.tags.forEach((tag) => {
				if (!tagIndex[tag]) {
					let tagObj = {
						name: tag,
						slug: tag.toSlug(),
						articles: [article]
					};
					site.context.tags.push(tagObj);
					tagIndex[tag] = tagObj
				} else {
					tagIndex[tag].articles.push(article)
				}
			})
		});

		let status = untagged.length === 0 ? 'done' : 'warn';
		process.stdout.write('[ ' + status +' ]\n');
		if (untagged.length > 0) {
			console.log('\nTotal of ' + untagged.length + ' untagged articles have been found:');
			untagged.forEach((article) => console.log('  > ' + article));
			console.log('');
		}

		site.context.tags.forEach((tag) => {
			let ratio = (tag.articles.length / site.context.articles.length);
			tag.ratio = Math.round(ratio * 10);
		});

		//console.log(site.context.tags)
		next()
	};

	task.updateCategoryArticles = function (next) {

		site.context.tags = site.context.tags instanceof Array ? site.context.tags : [];
		process.stdout.write(`${site.connection.name} > Indexing category articles tags...\t`);
		site.context.categories = filesToArticles(site.context.categories);
		process.stdout.write('[ done ]\n');
		next();

		function filesToArticles(categories) {
			categories.forEach((category) => {
				category.articles = [];
				category.articleFiles.forEach(function(articleFile) {
					let categoryUriStr = category.uri;
					if (categoryUriStr.slice(-1) !== '/') categoryUriStr += '/';
					categoryUriStr += articleFile.replace(/.md/, '');
					let article = helpers.findArticle(categoryUriStr, site.context.articles);
					if (article) category.articles.push(article);
				});
				if (category.categories.length > 0) {
					category.categories = filesToArticles(category.categories);
				}
				if (category.series.length > 0) {
					category.series = filesToArticles(category.series);
				}
			});
			return categories
		}
	};

	return task;
}

