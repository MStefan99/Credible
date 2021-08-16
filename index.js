'use strict';

const argumented = require('@mstefan99/argumented');
const SecureStorageProvider = require('./lib/SecureStorageProvider');


(() => {
	const s = new SecureStorageProvider('a', 'b');

	s.save('data/text', (Math.random() * 100000).toString(36))
			.then(() => s.load('data/text'))
			.catch(err => console.error(err))
			.then(data => console.log(data));
}).call({});

