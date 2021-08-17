'use strict';

const argumented = require('@mstefan99/argumented');
const SecureStorageProvider = require('./lib/SecureStorageProvider');


(() => {
	const s = new SecureStorageProvider('username', 'password');

	s.save('data/text', {customData: 'hello'}, null, {append: false})
			.then(context => s.load('data/text', context))
			.catch(err => console.error(err))
			.then(data => console.log(data));
}).call({});
