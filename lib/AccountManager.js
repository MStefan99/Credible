'use strict';

const crypto = require('crypto');
const util = require('util');

const Schema = require('./Schema');

const pbkdf2 = util.promisify(crypto.pbkdf2);

const PBKDF2ITERATIONS = 100000;


class User {
	#userData;
	#configStorageProvider;
	#dataStorageProvider;

	constructor(userData, configStorageProvider, dataStorageProvider) {
		if (!this) {
			throw new Error('Please call User constructor with new');
		}
		this.#userData = userData;
		this.#configStorageProvider = configStorageProvider;
		this.#dataStorageProvider = dataStorageProvider;

		return this;
	}


	saveData(key, value, append = true) {
		this.#registerKey(key);

		let dataPromise = Promise.resolve(value);
		if (append) {
			dataPromise = this.#dataStorageProvider.load(key)
					.then(oldData => JSON.parse(oldData))
					.then(oldValue => Object.assign(value, oldValue))
					.catch(() => Promise.resolve(value));
		}
		return dataPromise.then(value => this.#dataStorageProvider.save(key, value))
				.catch(err => Promise.reject(err));
	}


	loadData(key, schema) {
		return this.#dataStorageProvider.load(key)
				.then(data => Schema.apply(data, schema));
	}


	removeData(key) {
		this.#unregisterKey(key);
		return this.#dataStorageProvider.remove(key);
	}


	updatePassword(newPassword) {
		const updatePromise = Promise.resolve();
		const SecureStorageProvider = this.#dataStorageProvider.constructor;
		const newSecureStorageProvider = new SecureStorageProvider(this.#userData.username,
				newPassword);

		for (const key of this.#userData.keys) {
			updatePromise.then(() => this.#dataStorageProvider.load(key))
					.then(data => newSecureStorageProvider.save(key, data))
					.catch(err => Promise.reject(err));
		}

		return updatePromise.then(() => this.#dataStorageProvider = newSecureStorageProvider);
	}


	remove() {
		let deletePromise = Promise.resolve();

		for (const key of this.#userData.keys) {
			deletePromise.then(() => this.#dataStorageProvider.remove(key))
					.catch(err => Promise.reject(err));
		}

		return deletePromise.then(() => this.#configStorageProvider
				.remove(this.#userData.username));
	}


	#registerKey(key) {
		if (!this.#userData.keys) {
			this.#userData.keys = [];
		}

		if (!this.#userData.keys.some(p => p === key)) {
			this.#userData.keys.push(key);
		}

		return this.#configStorageProvider.save(this.#userData.username, this.#userData);
	}


	#unregisterKey(key) {
		if (!this.#userData.keys) {
			this.#userData.keys = [];
		}

		this.#userData.keys.splice(this.#userData.keys.indexOf(key));
		return this.#configStorageProvider.save(this.#userData.username, this.#userData);
	}
}


module.exports = class AccountManager {
	#storageProvider;
	#SecureStorageProvider;

	constructor(basePath = 'users',
			StorageProvider = require('./FileStorageProvider'),
			SecureStorageProvider = require('./SecureStorageProvider')) {
		if (!this) {
			throw new Error('Please call AccountManager constructor with new');
		} else if (!StorageProvider?.prototype?.load ||
				!StorageProvider?.prototype?.save
				|| !StorageProvider?.prototype?.remove) {
			throw new Error('Requested StorageProvider has incomplete API');
		} else if (!SecureStorageProvider?.prototype?.load
				|| !SecureStorageProvider?.prototype?.save) {
			throw new Error('Requested SecureStorageProvider has incomplete API');
		}
		this.#storageProvider = new StorageProvider(basePath);
		this.#SecureStorageProvider = SecureStorageProvider;

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

		return new Promise((resolve, reject) => {
			this.#storageProvider.load(username)
					.then(() => reject('User already exists'))
					.catch(() =>
							pbkdf2(password, passwordSalt, PBKDF2ITERATIONS,
									32, 'sha3-256')
									.then(key => userData.passwordKey = key.toString('base64'))
									.then(() => this.#storageProvider.save(username, userData))
									.catch(err => Promise.reject(err))
									.then(() => resolve(new User(userData,
											this.#storageProvider,
											new this.#SecureStorageProvider(username, password)))
									)
					);
		});
	}


	loadUser(username, password) {
		if (!username) {
			throw new Error('No username provided');
		} else if (!password) {
			throw new Error('No password provided');
		}

		return new Promise((resolve, reject) => {
			this.#storageProvider.load(username)
					.then(userData => pbkdf2(password,
							Buffer.from(userData.passwordSalt, 'base64'),
							PBKDF2ITERATIONS, 32, 'sha3-256')
							.then(key => {
								if (key.toString('base64') !== userData.passwordKey) {
									throw new Error('Wrong password');
								}
								resolve(new User(userData,
										this.#storageProvider,
										new this.#SecureStorageProvider(username, password)));
							})
					)
					.catch(err => reject('Failed to load user'));
		});
	}
};
