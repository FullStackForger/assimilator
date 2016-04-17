'use strict';
// usage:
// {{element array objKey objValue}}
// will return first object from array where obj[objKey] equals objValue
// will return null if element cant be selected
var element = module.exports = function() {

	let args = Array.prototype.slice.call(arguments);

	let array = args[0];
	let key = args[1];
	let value = args[2];
	let context = args[3];
	let found = false;
	let index = 0;

	while(!found && array && index < array.length) {
		let obj = array[index];
		if (obj.hasOwnProperty(key) && obj[key] === value) {
			return obj
		}
		index++
	}
	return null;
	//return JSON.stringify(args, null, 2);
};

module.exports = element;