'use strict';

const argumented = require('@mstefan99/argumented');
const SecureStorageProvider = require('./lib/SecureStorageProvider');


(() => {
	const s = new SecureStorageProvider('username', 'password');

	s.save('data', {customData: 'hello'})
			.then(data => s.load('data', data))
			.catch(err => console.error(err))
			.then(data => console.log(data));
}).call({});
