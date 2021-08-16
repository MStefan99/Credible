'use strict';

const crypto = require('crypto');


class SecureStorageProvider {
	#username;
	#password;
	#storageProvider;

	constructor(username, password, options = {},
			StorageProvider = require('./FileStorageProvider')) {

		if (!this) {
			throw new Error('Please call SecureStorageProvider constructor with new!');
		} else if (!username) {
			throw new Error('No username provided');
		} else if (!password) {
			throw new Error('No password provided');
		} else if (typeof StorageProvider.prototype.load === 'undefined' ||
				typeof StorageProvider.prototype.save === 'undefined') {
			throw new Error('The requested StorageProvider has missing methods');
		}
		this.#username = username;
		this.#password = password;
		this.#storageProvider = new StorageProvider(...options?.storageOptions ?? []);

		return this;
	}


	save(storagePath, data, options) {
		// Encrypt
		return this.#storageProvider.save(storagePath, data, options);
	};


	load(storagePath, options) {
		return this.#storageProvider.load(storagePath, options);
		// Decrypt
	};
}


module.exports = SecureStorageProvider;
