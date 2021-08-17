'use strict';

const argumented = require('@mstefan99/argumented');
const AccountManager = require('./lib/AccountManager');
const Schema = require('./lib/Schema');


(() => {
	const obj = Schema.applySchema({
		number: 1,
		secondNumber: 2,
		array: [1, 2, 3],
		bool: true,
		nothing: null,
		obj: {
			a: 1,
			b: '2',
			c: true,
			d: [1, 2]
		}
	}, {
		obj: {
			a: true,
			d: true
		},
		nothing: true,
		hello: true
	});

	console.log(obj);
}).call({});
