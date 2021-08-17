'use strict';

const crypto = require('crypto');
const util = require('util');

const pbkdf2 = util.promisify(crypto.pbkdf2);

const PBKDF2ITERATIONS = 100000;


module.exports = class CryptoProvider {
	#username;
	#password;
	#storageProvider;

	constructor(username, password, options = {},
			StorageProvider = require('./FileStorageProvider')) {

		if (!this) {
			throw new Error('Please call CryptoProvider constructor with new');
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
		this.#storageProvider = new StorageProvider();

		return this;
	}


	pack(data, secureContext) {
		if (typeof data === 'undefined') {
			throw new Error('Data must be defined');
		}

		const authSalt = secureContext?.authSalt ?? crypto.randomBytes(32);
		const encryptionSalt = secureContext?.encryptionSalt ?? crypto.randomBytes(32);
		const encryptionIV = secureContext?.encryptionIV ?? crypto.randomBytes(16);

		return new Promise((resolve, reject) => {
			const authPromise = pbkdf2(this.#password, authSalt, PBKDF2ITERATIONS, 32, 'sha3-256')
					.then(authKey => {
						if (typeof data !== 'string') {
							data = JSON.stringify(data);
						}
						const dataString = Buffer.from(data, 'utf-8').toString('base64');
						return dataString + ':' + crypto.createHmac('sha3-256', authKey)
								.update(dataString)
								.digest('base64');
					});

			const encryptPromise = pbkdf2(this.#password, encryptionSalt, PBKDF2ITERATIONS, 32, 'sha3-256')
					.then(key =>
							authPromise.then(authenticatedData => {
								const cipher = crypto.createCipheriv('aes-256-cbc', key, encryptionIV);
								let encryptedData = cipher.update(authenticatedData, 'utf-8', 'base64');
								encryptedData += cipher.final('base64');

								return encryptedData;
							})
					);

			return authPromise
					.then(() => encryptPromise)
					.then(data => resolve({
						encryptedData: data,
						secureContext: {
							authSalt: Buffer.from(authSalt).toString('base64'),
							encryptionSalt: Buffer.from(encryptionSalt).toString('base64'),
							encryptionIV: Buffer.from(encryptionIV).toString('base64')
						}
					}));
		});
	};


	unpack(encryptedData, secureContext) {
		if (!secureContext.authSalt || !secureContext.encryptionSalt || !secureContext.encryptionIV) {
			throw new Error('Invalid context provided');
		}

		const authSalt = Buffer.from(secureContext.authSalt, 'base64');
		const encryptionSalt = Buffer.from(secureContext.encryptionSalt, 'base64');
		const encryptionIV = Buffer.from(secureContext.encryptionIV, 'base64');

		return new Promise((resolve, reject) => {
			const decryptPromise = pbkdf2(this.#password, encryptionSalt,
					PBKDF2ITERATIONS, 32, 'sha3-256')
					.then(key => {
						const decipher = crypto.createDecipheriv('aes-256-cbc',
								key, encryptionIV);
						let decrypted = decipher.update(Buffer.from(encryptedData, 'base64', 'utf-8'));
						decrypted += decipher.final('utf-8');

						return decrypted;
					});

			const verifyPromise = pbkdf2(this.#password, authSalt,
					PBKDF2ITERATIONS, 32, 'sha3-256')
					.then(key =>
							decryptPromise.then(authenticatedData => {
								if (!authenticatedData.match(':')) {
									reject({message: 'Invalid message format'});
								}

								const [dataString, signature] = authenticatedData.split(':');

								if (signature !== crypto.createHmac('sha3-256', key)
										.update(dataString)
										.digest('base64')) {
									throw new Error('WARNING: Signature of the saved message does not match. ' +
											'Someone might have modified your stored data!');
								}

								return Buffer.from(dataString, 'base64').toString('utf-8');
							})
					);

			return decryptPromise
					.then(() => verifyPromise)
					.then(data => resolve(data));
		});
	};
};
