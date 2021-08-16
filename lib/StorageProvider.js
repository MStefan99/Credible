'use strict';

const path = require('path');
const fs = require('fs');
const util = require('util');


const stat = util.promisify(fs.stat);
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const mkdir = util.promisify(fs.mkdir);


module.exports = function () {
	function StorageProvider() {
		if (!this) {
			throw new Error('Please call StorageProvider constructor with new!');
		}

		return this;
	}


	StorageProvider.prototype.readFile = function (filePath, options) {
		return new Promise((resolve, reject) => {
			const fullPath = path.resolve(filePath);
			readFile(fullPath, 'utf-8')
				.then(res => resolve(res))
				.catch(() => reject(stat(path.dirname(fullPath))));
		});
	};


	StorageProvider.prototype.writeFile = function (filePath, data, options) {
		return new Promise((resolve, reject) => {
			const fullPath = path.resolve(filePath);
			writeFile(fullPath, data)
				.then(() => resolve())
				.catch(err => {
					if (err.errno === -4058) { // Directory does not exist
						return mkdir(path.dirname(fullPath), {recursive: true})
							.then(() => writeFile(fullPath, data));
					} else {  // Errors we can't deal with
						reject(err);
					}
				})
				.then(() => resolve())
				.catch(err => reject(err));
		});
	};

	return new StorageProvider;
};
