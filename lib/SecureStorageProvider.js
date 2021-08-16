'use strict';

const crypto = require('crypto');


function SecureStorageProvider(username, password, options = {},
		StorageProvider = require('./FileStorageProvider')) {

	let _username;
	let _password;
	let _storageProvider;

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
	_username = username;
	_password = password;
	_storageProvider = new StorageProvider(...options?.storageOptions ?? []);


	SecureStorageProvider.prototype.save = function (storagePath, data, options) {
		// Encrypt
		return _storageProvider.save(storagePath, data, options);
	};


	SecureStorageProvider.prototype.load = function (storagePath, options) {
		return _storageProvider.load(storagePath, options);
		// Decrypt
	};

	return this;
}


module.exports = SecureStorageProvider;
