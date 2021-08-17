'use strict';


module.exports = class SecureStorageProvider {
	#cryptoProvider;
	#storageProvider;

	constructor(username, password, basePath = 'data',
			CryptoProvider = require('./CryptoProvider'),
			StorageProvider = require('./FileStorageProvider')) {
		if (!this) {
			throw new Error('Please call SecureStorageProvider constructor with new');
		} else if (!username) {
			throw new Error('No username provided');
		} else if (!password) {
			throw new Error('No password provided');
		} else if (!CryptoProvider.prototype.pack
				|| !CryptoProvider.prototype.unpack) {
			throw new Error('Requested CryptoProvider has an incomplete API');
		} else if (!StorageProvider.prototype.load
				|| !StorageProvider.prototype.save) {
			throw new Error('Requested StorageProvider has an incomplete API');
		}

		this.#cryptoProvider = new CryptoProvider(username, password);
		this.#storageProvider = new StorageProvider([basePath, username].join('/'));

		return this;
	}


	load(storagePath) {
		return this.#storageProvider.load(storagePath)
				.then(packedData => this.#cryptoProvider.unpack(packedData));
	}


	save(storagePath, data) {
		return this.#cryptoProvider.pack(data)
				.then(packedData => this.#storageProvider.save(storagePath, packedData));
	}
};
