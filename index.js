'use strict';

const argumented = require('@mstefan99/argumented');
const AccountManager = require('./lib/AccountManager');


(() => {
	const accountManager = new AccountManager();

	accountManager.loadUser('mstefan99', 'testtest')
			// .then(user => user.updatePassword('testtest2'))
			// .then(user => user.saveData('test', {data: 'string'}))
			// .then(user => user.loadData('test'))
			.then(user => user.removeData('test'))
			.then(data => console.log(data));
}).call({});
