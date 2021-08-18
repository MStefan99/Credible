'use strict';

const AccountManager = require('./AccountManager');
const accountManager = new AccountManager;


function exit(code, err, message) {
	if (err) {
		process.stderr.write(err.toString());
	}
	if (message && !err) {
		process.stdout.write(message.toString());
	}
	process.exit(code);
}


module.exports = class CLIInterface {
	static addUser(username, password) {
		if (!username || !password) {
			exit(-1, 'Not authorized');
		}

		accountManager.createUser(username, password)
				.then(() => exit(0))
				.catch(err => exit(1, err));
	}


	static changePassword(username, password, newPassword) {
		if (!username || !password) {
			exit(-1, 'Not authorized');
		} else if (!newPassword) {
			exit(-1, 'New password not provided');
		}

		accountManager.loadUser(username, password)
				.catch(err => exit(2, err))
				.then(user => user.updatePassword(newPassword))
				.then(() => exit(0))
				.catch(err => exit(3, err));
	}


	static removeUser(username, password) {
		if (!username || !password) {
			exit(-1, 'Not authorized');
		}

		accountManager.loadUser(username, password)
				.catch(err => exit(2, err))
				.then(user => user.remove())
				.then(() => exit(0))
				.catch(err => exit(3, err));
	}


	static readData(username, password, key, schema) {
		if (!username || !password) {
			exit(-1, 'Not authorized');
		} else if (!key) {
			exit(-1, 'No key provided');
		} else if (!schema) {
			exit(-1, 'No schema provided');
		}

		accountManager.loadUser(username, password)
				.catch(err => exit(2, err))
				.then(user => user.loadData(key, JSON.parse(schema)))
				.then(data => exit(0, null, JSON.stringify(data)))
				.catch(err => exit(3, err));
	}


	static writeData(username, password, key, data) {
		if (!username || !password) {
			exit(-1, 'Not authorized');
		} else if (!key) {
			exit(-1, 'No key provided');
		} else if (!data) {
			exit(-1, 'No data provided');
		}

		accountManager.loadUser(username, password)
				.catch(err => exit(2, err))
				.then(user => user.saveData(key, JSON.parse(data)))
				.then(() => exit(0))
				.catch(err => exit(3, err));
	}


	static removeData(username, password, key) {
		if (!username || !password) {
			exit(-1, 'Not authorized');
		} else if (!key) {
			exit(-1, 'No key provided');
		}

		accountManager.loadUser(username, password)
				.catch(err => exit(2, err))
				.then(user => user.removeData(key))
				.then(() => exit(0))
				.catch(err => exit(3, err));
	}
};
