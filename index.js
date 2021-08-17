'use strict';

const argumented = require('@mstefan99/argumented');
const AccountManager = require('./lib/AccountManager');


(() => {
	const accountManager = new AccountManager();

	// accountManager.createUser('mstefan99', 'testtest');
	accountManager.loadUser('mstefan99', 'testtest')
			.then(user => user.registerPath('datapath'));
}).call({});
