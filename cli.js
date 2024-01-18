'use strict';

const argumented = require('./lib/argumented');
const credible = require('./lib/Credible');


function exit(code, err, message) {
	if (err) {
		process.stderr.write(err.toString());
	}
	if (message && !err) {
		process.stdout.write(message.toString());
	}
	process.exit(code);
}


function addUser(username, password) {
	if (!username || !password) {
		exit(-1, 'Not authorized');
	}

	credible.createUser(username, password)
			.then(() => exit(0))
			.catch(err => exit(1, err));
}


function removeUser(username, password) {
	if (!username || !password) {
		exit(-1, 'Not authorized');
	}

	credible.loadUser(username, password)
			.catch(err => exit(2, err))
			.then(user => user.remove())
			.then(() => exit(0))
			.catch(err => exit(3, err));
}


function readData(username, password, key, schema) {
	if (!username || !password) {
		exit(-1, 'Not authorized');
	} else if (!key) {
		exit(-1, 'No key provided');
	} else if (!schema) {
		exit(-1, 'No schema provided');
	}

	credible.loadUser(username, password)
			.catch(err => exit(2, err))
			.then(user => user.loadData(key, JSON.parse(schema)))
			.then(data => exit(0, null, JSON.stringify(data)))
			.catch(err => exit(3, err));
}


function writeData(username, password, key, data) {
	if (!username || !password) {
		exit(-1, 'Not authorized');
	} else if (!key) {
		exit(-1, 'No key provided');
	} else if (!data) {
		exit(-1, 'No data provided');
	}

	credible.loadUser(username, password)
			.catch(err => exit(2, err))
			.then(user => user.saveData(key, JSON.parse(data)))
			.then(() => exit(0))
			.catch(err => exit(3, err));
}


function removeData(username, password, key) {
	if (!username || !password) {
		exit(-1, 'Not authorized');
	} else if (!key) {
		exit(-1, 'No key provided');
	}

	credible.loadUser(username, password)
			.catch(err => exit(2, err))
			.then(user => user.removeData(key))
			.then(() => exit(0))
			.catch(err => exit(3, err));
}


(() => {
	argumented.add('username', ['-u', '--username'], ['username'],
			'Username required for CLI mode');
	argumented.add('password', ['-p', '--password'], ['password'],
			'Password required for CLI mode');
	argumented.add('key', ['-k', '--key'], ['key'],
			'Key of the data to save/load');
	argumented.add('schema', ['-s', '--schema'], ['schema'],
			'Schema to use for retrieving data');
	argumented.add('data', ['-d', '--data'], ['data'],
			'Data to store');
	argumented.positionalDesc('action', 'Action to perform. Available actions: ' +
			'add-user, remove-user, read-data, write-data and remove-data.');
	const config = argumented.parse();

	switch (config.positional[0]) {  // Action to perform
		case 'add-user':
			addUser(config.username, config.password);
			break;
		case 'remove-user':
			removeUser(config.username, config.password);
			break;
		case 'read-data':
			readData(config.username, config.password, config.key, config.schema);
			break;
		case 'write-data':
			writeData(config.username, config.password, config.key, config.data);
			break;
		case 'remove-data':
			removeData(config.username, config.password, config.key);
			break;
	}
}).call({});
