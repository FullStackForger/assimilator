var helpers = module.exports = {
	findCategory: findCategory
}

function findCategory (uri, categories) {
	'use strict'
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