'use strict';

const path = require('path');
const fs = require('fs');
const util = require('util');


const stat = util.promisify(fs.stat);
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const mkdir = util.promisify(fs.mkdir);


module.exports = class FileStorageProvider {
	rootDir;

	constructor(rootDir = '.') {
		if (!this) {
			throw new Error('Please call FileStorageProvider constructor with new');
		}
		this.rootDir = rootDir;
		return this;
	}


	load(filePath, options) {
		if (!filePath) {
			throw new Error('File path not specified');
		}
		const fullPath = path.resolve(this.rootDir, filePath.replace(/\/$/));

		return new Promise((resolve, reject) => {
			readFile(fullPath, 'utf-8')
					.then(res => resolve(res))
					.catch(() => reject(stat(path.dirname(fullPath))));
		});
	};


	save(filePath, data, options) {
		if (!filePath) {
			throw new Error('File path not specified');
		} else if (typeof data === 'undefined') {
			throw new Error('Data must be defined');
		}
		const fullPath = path.resolve(this.rootDir, filePath.replace(/\/$/));

		return new Promise((resolve, reject) => {
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
};
