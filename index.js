'use strict';

const argumented = require('@mstefan99/argumented');
const StorageProvider = require('./lib/StorageProvider');


(() => {
	const s = new StorageProvider;

	s.writeFile('./data/text.txt', 'stuff')
		.then(() => s.readFile('./data/text.txt'))
		.then(data => console.log(data))
		.catch(err => console.error(err));
}).call({});

