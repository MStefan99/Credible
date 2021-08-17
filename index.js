'use strict';

const argumented = require('@mstefan99/argumented');
const SecureStorageProvider = require('./lib/SecureStorageProvider');


(() => {
	const s = new SecureStorageProvider('a', 'b');

	s.save('data/text', {customData: 'hello'})
			.then(data => console.log(data))
			.then(() => s.load('data/text'))
			.catch(err => console.error(err))
			.then(data => console.log(data));
}).call({});

