'use strict';

const crypto = require('crypto');
const util = require('util');

const pbkdf2 = util.promisify(crypto.pbkdf2);

const PBKDF2ITERATIONS = 100000;


module.exports = class CryptoProvider {
	#password;

	constructor(password, options = {},
			StorageProvider = require('./FileStorageProvider')) {

		if (!this) {
			throw new Error('Please call CryptoProvider constructor with new');
		} else if (!password) {
			throw new Error('No password provided');
		} else if (!StorageProvider.prototype.load ||
				!StorageProvider.prototype.save) {
			throw new Error('Requested StorageProvider has an incomplete API');
		}
		this.#password = password;

		return this;
	}


	pack(data) {
		if (typeof data === 'undefined') {
			throw new Error('No data provided to save');
		}

		const authSalt = crypto.randomBytes(32);
		const encryptionSalt = crypto.randomBytes(32);
		const encryptionIV = crypto.randomBytes(16);

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
					}))
					.catch(err => reject(err));
		});
	};


	unpack(packedData) {
		if (!packedData) {
			throw new Error('No data to decrypt');
		} else if (typeof packedData === 'string') {
			packedData = JSON.parse(packedData);
		} else if (!packedData.encryptedData) {
			throw new Error('Packed data contains no data to decrypt');
		} else if (!packedData.secureContext.authSalt
				|| !packedData.secureContext.encryptionSalt
				|| !packedData.secureContext.encryptionIV) {
			throw new Error('Invalid context provided');
		}

		const authSalt = Buffer.from(packedData.secureContext.authSalt, 'base64');
		const encryptionSalt = Buffer.from(packedData.secureContext.encryptionSalt, 'base64');
		const encryptionIV = Buffer.from(packedData.secureContext.encryptionIV, 'base64');

		return new Promise((resolve, reject) => {
			const decryptPromise = pbkdf2(this.#password, encryptionSalt,
					PBKDF2ITERATIONS, 32, 'sha3-256')
					.then(key => {
						const decipher = crypto.createDecipheriv('aes-256-cbc',
								key, encryptionIV);
						try {
							let decrypted = decipher.update(
									Buffer.from(packedData.encryptedData, 'base64', 'utf-8'));
							decrypted += decipher.final('utf-8');
							return decrypted;
						} catch (e) {
							if (e.code === 'ERR_OSSL_EVP_BAD_DECRYPT') {
								throw new Error('Cannot decrypt the message. Are you using the wrong password?');
							}
						}
					});

			const verifyPromise = pbkdf2(this.#password, authSalt,
					PBKDF2ITERATIONS, 32, 'sha3-256')
					.then(key =>
							decryptPromise.then(authenticatedData => {
								if (!authenticatedData.match(':')) {
									throw new Error('Invalid message format');
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
					.then(data => resolve(data))
					.catch(err => reject(err));
		});
	}
};
