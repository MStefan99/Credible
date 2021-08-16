'use strict';

const argumented = require('@mstefan99/argumented');
const StorageProvider = require('./lib/StorageProvider');


(() => {
	const s = new StorageProvider;

	s.writeFile('./a/text.txt', 'stuff')
		.then(() => s.readFile('./a/text.txt'))
		.then(data => console.log(data))
		.catch(err => console.error(err));
}).call({});

