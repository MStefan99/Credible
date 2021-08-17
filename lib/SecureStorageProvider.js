'use strict';

const crypto = require('crypto');
const util = require('util');

const pbkdf2 = util.promisify(crypto.pbkdf2);

const PBKDF2ITERATIONS = 100000;


module.exports = class SecureStorageProvider {
	#username;
	#password;
	#storageProvider;

	constructor(username, password, options = {},
			StorageProvider = require('./FileStorageProvider')) {

		if (!this) {
			throw new Error('Please call SecureStorageProvider constructor with new');
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


	save(storagePath, data, configPath, options) {
		// Encrypt
		return new Promise((resolve, reject) => {
			this.load(storagePath, options)
					.then(oldData => Object.assign(oldData, data))
					.then(newData => {
						const authSalt = crypto.randomBytes(32);
						const encryptionSalt = crypto.randomBytes(32);
						const encryptionIV = crypto.randomBytes(16);

						const authPromise = pbkdf2(this.#password, authSalt, PBKDF2ITERATIONS, 32, 'sha3-512')
								.then(authKey => {
									const dataString = Buffer.from(JSON.stringify(newData)).toString('base64');
									return dataString + ':' + crypto.createHmac('sha3-512', authKey)
											.update(dataString)
											.digest('base64');
								});

						const encryptionPromise = pbkdf2(this.#password, encryptionSalt, PBKDF2ITERATIONS, 32, 'sha3-512')
								.then(key => {
									authPromise.then(authenticatedData => {
										const cipher = crypto.createCipheriv('aes-256-cbc', key, encryptionIV);
										let encryptedData = cipher.update(authenticatedData, 'utf-8', 'base64');
										encryptedData += cipher.final('base64');
										console.log('Encrypted:', encryptedData);

										const decipher = crypto.createDecipheriv('aes-256-cbc',
												key, encryptionIV);
										let decrypted = decipher.update(Buffer.from(encryptedData, 'base64', 'utf-8'));
										decrypted += decipher.final('utf-8');
										console.log('\nDecrypted:', decrypted);

										return this.#storageProvider.save(storagePath, encryptedData, options);
									});
								});

						return authPromise
								.then(() => encryptionPromise)
								.then(() => resolve({
									authSalt: Buffer.from(authSalt).toString('base64'),
									encryptionSalt: Buffer.from(encryptionSalt).toString('base64'),
									encryptionIV: Buffer.from(encryptionIV).toString('base64')
								}));
					});
		});
	};


	load(storagePath, secureContext, options) {
		return new Promise((resolve, reject) => {
			resolve({
				someData: 1,
				someOtherData: false,
				veryImportantText: 'example'
			});
		});
		// return this.#storageProvider.load(storagePath, options);
		// Decrypt
	};
};
