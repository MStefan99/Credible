'use strict';

const path = require('path');
const fs = require('fs');
const util = require('util');
const crypto = require('crypto');

const StorageProvider = require('./StorageProvider');


module.exports = function () {
	function SecureStorageProvider() {
		if (!this) {
			throw new Error('Please call SecureStorageProvider constructor with new!');
		}

		return this;
	}

	return new SecureStorageProvider;
};
