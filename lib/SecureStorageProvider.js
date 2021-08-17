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
		}

		this.#cryptoProvider = new CryptoProvider(username, password);
		this.#storageProvider = new StorageProvider([basePath, username].join('/'));

		return this;
	}


	load(storagePath) {
		return this.#storageProvider.load(storagePath)
				.then(packedData => JSON.parse(packedData))
				.then(packedData => this.#cryptoProvider.unpack(packedData));
	}


	save(storagePath, data) {
		return this.#cryptoProvider.pack(data)
				.then(packedData => JSON.stringify(packedData))
				.then(packedData => this.#storageProvider.save(storagePath, packedData));
	}
};
