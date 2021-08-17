'use strict';

const crypto = require('crypto');
const util = require('util');

const pbkdf2 = util.promisify(crypto.pbkdf2);

const PBKDF2ITERATIONS = 100000;


class User {
	#userData;
	#storageProvider;

	constructor(userData, storageProvider) {
		if (!this) {
			throw new Error('Please call User constructor with new');
		}
		this.#userData = userData;
		this.#storageProvider = storageProvider;

		return this;
	}


	registerPath(path) {
		if (!this.#userData.keys) {
			this.#userData.keys = [];
		}

		if (!this.#userData.keys.some(p => p === path)) {
			this.#userData.keys.push(path);
		}

		return this.#storageProvider.save(this.#userData.username, this.#userData)
				.then(() => this);
	}


	deregisterPath(path) {
		if (!this.#userData.keys) {
			this.#userData.keys = [];
		}

		this.#userData.keys.splice(this.#userData.findIndex(path));
		return this.#storageProvider.save(this.#userData.username, this.#userData)
				.then(() => this);
	}
}


module.exports = class AccountManager {
	#storageProvider;

	constructor(basePath = 'users',
			StorageProvider = require('./FileStorageProvider')) {
		if (!this) {
			throw new Error('Please call AccountManager constructor with new');
		} else if (!StorageProvider.prototype.load ||
				!StorageProvider.prototype.save) {
			throw new Error('Requested StorageProvider has incomplete API');
		}
		this.#storageProvider = new StorageProvider(basePath);

		return this;
	}


	createUser(username, password) {
		if (!username) {
			throw new Error('No username provided');
		} else if (!password) {
			throw new Error('No password provided');
		} else if (password.length < 8) {
			throw new Error('Password must contain at least 8 characters');
		}
		const passwordSalt = crypto.randomBytes(32);

		const userData = {
			username: username,
			keys: [],
			passwordSalt: passwordSalt.toString('base64')
		};

		return new Promise(resolve => {
			pbkdf2(password, passwordSalt, PBKDF2ITERATIONS,
					32, 'sha3-256')
					.then(key => userData.passwordKey = key.toString('base64'))
					.then(() => this.#storageProvider.save(username, userData));

			resolve(new User(userData, this.#storageProvider));
		});
	}


	loadUser(username, password) {
		if (!username) {
			throw new Error('No username provided');
		} else if (!password) {
			throw new Error('No password provided');
		}

		return new Promise(resolve => {
			this.#storageProvider.load(username)
					.then(userData => pbkdf2(password,
							Buffer.from(userData.passwordSalt, 'base64'),
							PBKDF2ITERATIONS, 32, 'sha3-256')
							.then(key => {
								if (key.toString('base64') !== userData.passwordKey) {
									throw new Error('Wrong password');
								}
								resolve(new User(userData, this.#storageProvider));
							})
					);
		});
	}
};
