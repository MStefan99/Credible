'use strict';

const argumented = require('@mstefan99/argumented');
const CryptoProvider = require('./lib/CryptoProvider');


(() => {
	const s = new CryptoProvider('username', 'password');

	s.pack({customData: 'hello'})
			.then(data => s.unpack(data))
			.catch(err => console.error(err))
			.then(data => console.log(data));
}).call({});
