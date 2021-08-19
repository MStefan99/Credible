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


	#updatePassword(newPassword) {
		return Promise.reject('Not implemented');

		// TODO: create new provider and re-encrypt data
		const updatePromise = Promise.resolve();
		const SecureStorageProvider = this.#dataStorageProvider.constructor;
		const newDataStorageProvider = new SecureStorageProvider(this.#userData.username,
				newPassword);
		const passwordSalt = crypto.randomBytes(32);
		this.#userData.passwordSalt = passwordSalt.toString('base64');

		for (const key of this.#userData.keys) {
			updatePromise.then(() => this.#dataStorageProvider.load(key))
					.then(data => newDataStorageProvider.save(key, data));
		}

		return updatePromise
				.then(() => this.#dataStorageProvider = newDataStorageProvider)
				.then(() => pbkdf2(newPassword, passwordSalt,
						PBKDF2ITERATIONS, 32, 'sha3-256'))
				.then(key => this.#userData.passwordKey = key.toString('base64'))
				.then(() => this.#configStorageProvider
						.save(this.#userData.username, this.#userData))
				.catch(err => Promise.reject(err));
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


const defaultOptions = {
	userPath: 'users',
	dataPath: 'data',
	StorageProvider: require('./FileStorageProvider'),
	CryptoProvider: require('./CryptoProvider'),
	SecureStorageProvider: require('./SecureStorageProvider')
};


module.exports = {
	createUser(username, password, options) {
		options = Object.assign({}, defaultOptions, options);

		if (!username) {
			throw new Error('No username provided');
		} else if (!password) {
			throw new Error('No password provided');
		} else if (password.length < 8) {
			throw new Error('Password must contain at least 8 characters');
		} else if (!options.StorageProvider?.prototype?.load ||
				!options.StorageProvider?.prototype?.save
				|| !options.StorageProvider?.prototype?.remove) {
			throw new Error('Requested StorageProvider has incomplete API');
		} else if (!options.SecureStorageProvider?.prototype?.load
				|| !options.SecureStorageProvider?.prototype?.save) {
			throw new Error('Requested SecureStorageProvider has incomplete API');
		}
		const passwordSalt = crypto.randomBytes(32);
		const userData = {
			username: username,
			keys: [],
			passwordSalt: passwordSalt.toString('base64')
		};
		const storageProvider = new options.StorageProvider(options.userPath);

		return new Promise((resolve, reject) => {
			storageProvider.load(username)
					.then(() => reject('User already exists'))
					.catch(() =>
							pbkdf2(password, passwordSalt, PBKDF2ITERATIONS,
									32, 'sha3-256')
									.then(key => userData.passwordKey = key.toString('base64'))
									.then(() => storageProvider.save(username, userData))
									.catch(err => Promise.reject(err))
									.then(() => resolve(new User(userData,
											new options.StorageProvider(options.userPath),
											new options.SecureStorageProvider(username, password,
													options.dataPath, options.CryptoProvider, options.StorageProvider)))
									)
					);
		});
	},


	loadUser(username, password, options) {
		options = Object.assign({}, defaultOptions, options);
		if (!username) {
			throw new Error('No username provided');
		} else if (!password) {
			throw new Error('No password provided');
		} else if (!options.StorageProvider?.prototype?.load ||
				!options.StorageProvider?.prototype?.save
				|| !options.StorageProvider?.prototype?.remove) {
			throw new Error('Requested StorageProvider has incomplete API');
		} else if (!options.SecureStorageProvider?.prototype?.load
				|| !options.SecureStorageProvider?.prototype?.save) {
			throw new Error('Requested SecureStorageProvider has incomplete API');
		}
		const storageProvider = new options.StorageProvider(options.userPath);

		return new Promise((resolve, reject) => {
			storageProvider.load(username)
					.then(userData => pbkdf2(password,
							Buffer.from(userData.passwordSalt, 'base64'),
							PBKDF2ITERATIONS, 32, 'sha3-256')
							.then(key => {
								if (key.toString('base64') !== userData.passwordKey) {
									reject('Wrong password');
								}
								resolve(new User(userData,
										new options.StorageProvider(options.userPath),
										new options.SecureStorageProvider(username, password,
												options.dataPath, options.CryptoProvider, options.StorageProvider)));
							})
					)
					.catch(() => reject('Failed to load user'));
		});
	}
};
