'use strict';

const path = require('path');


module.exports = class SecureStorageProvider {
	#username;
	#password;
	#dataPath;
	#configPath;
	#cryptoProvider;
	#storageProvider;

	constructor(username, password, dataPath = 'data', configPath = 'config',
			CryptoProvider = require('./CryptoProvider'),
			StorageProvider = require('./FileStorageProvider')) {
		if (!this) {
			throw new Error('Please call SecureStorageProvider constructor with new');
		} else if (!username) {
			throw new Error('No username provided');
		} else if (!password) {
			throw new Error('No password provided');
		}

		this.#username = username;
		this.#password = password;
		this.#dataPath = dataPath;
		this.#configPath = configPath;
		this.#cryptoProvider = new CryptoProvider(username, password,
				options?.cryptoOptions);
		this.#storageProvider = new StorageProvider(options?.storageOptions);

		return this;
	}


	load(path) {
		this.#storageProvider.load([this.#configPath, this.#username, path].join('/'));
	}


	save(path, data, config) {

	}
};
