'use strict';

const crypto = require('crypto');

const StorageProvider = require('./StorageProvider');


module.exports = function () {
	let _username;
	let _password;

	function SecureStorageProvider(username, password) {
		if (!this) {
			throw new Error('Please call SecureStorageProvider constructor with new!');
		} else if (!username) {
			throw new Error('No username provided');
		} else if (!password) {
			throw new Error('No password provided');
		}
		_username = username;
		_password = password;

		return this;
	}


	SecureStorageProvider.prototype.writeFile = function (filePath, data, options) {
		// Encrypt
		new StorageProvider().writeFile(filePath, data, options);
	};


	SecureStorageProvider.prototype.readFile = function (filePath, options) {
		new StorageProvider().readFile(filePath, options);
		// Decrypt
	};

	return new SecureStorageProvider;
};
