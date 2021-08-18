'use strict';

const argumented = require('@mstefan99/argumented');

const cli = require('./cli');


(() => {
	argumented.add('username', ['-u', '--username'], ['username'],
			'Username required for CLI mode');
	argumented.add('password', ['-p', '--password'], ['password'],
			'Password required for CLI mode');
	argumented.add('newPassword', ['-n', '--new-password'], ['newPassword'],
			'New password to set');
	argumented.add('key', ['-k', '--key'], ['key'],
			'Key of the data to save/load');
	argumented.add('schema', ['-s', '--schema'], ['schema'],
			'Schema to use for retrieving data');
	argumented.add('data', ['-d', '--data'], ['data'],
			'Data to store');
	argumented.positionalDesc('action', 'Action to perform. Available actions: ' +
			'add-user, change-password, remove-user, read-data, write-data and remove-data.');
	const config = argumented.parse();

	switch (config.positional[0]) {  // Action to perform
		case 'add-user':
			cli.addUser(config.username, config.password);
			break;
		case 'change-password':
			cli.changePassword(config.username, config.password, config.newPassword);
			break;
		case 'remove-user':
			cli.removeUser(config.username, config.password);
			break;
		case 'read-data':
			cli.readData(config.username, config.password, config.key, config.schema);
			break;
		case 'write-data':
			cli.writeData(config.username, config.password, config.key, config.data);
			break;
		case 'remove-data':
			cli.removeData(config.username, config.password, config.key);
			break;
	}
}).call({});
