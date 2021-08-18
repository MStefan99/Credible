'use strict';


module.exports = class Schema {
	static apply(object, schema) {
		if (typeof object === 'object') {
			return this.#recursiveApply(object, schema);
		} else {
			return schema? object : null;
		}
	}


	static #recursiveApply(object, schema, result = {}) {
		if (typeof object === 'object' && !Array.isArray(object) && object !== null) {
			for (const key of Object.keys(schema)) {
				result[key] = this.#recursiveApply(object[key], schema[key], result[key]);
			}
			return result;
		} else {
			return schema? object : undefined;
		}
	}
};
