'use strict';

const path = require('path');
const fs = require('fs');
const util = require('util');


const stat = util.promisify(fs.stat);
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);
const mkdir = util.promisify(fs.mkdir);


module.exports = class FileStorageProvider {
	basePath;

	constructor(basePath) {
		if (!this) {
			throw new Error('Please call FileStorageProvider constructor with new');
		}
		this.basePath = ['storage', basePath].join('/');
		return this;
	}


	load(filePath) {
		if (!filePath) {
			throw new Error('File path not specified');
		}
		const fullPath = path.resolve(this.basePath,
				filePath.replace(/\/$/, '')) + '.json';

		return new Promise((resolve, reject) => {
			readFile(fullPath, 'utf-8')
					.then(res => resolve(JSON.parse(res)))
					.catch(() => reject(stat(path.dirname(fullPath))));
		});
	}


	save(filePath, data) {
		if (!filePath) {
			throw new Error('File path not specified');
		} else if (typeof data === 'undefined') {
			throw new Error('No data provided to save');
		}

		if (typeof data !== 'string') {
			data = JSON.stringify(data);
		}

		const fullPath = path.resolve(this.basePath,
				filePath.replace(/\/$/, '')) + '.json';

		return new Promise((resolve, reject) => {
			writeFile(fullPath, data)
					.then(() => resolve())
					.catch(err => {
						if (err.errno === -4058) {  // Directory does not exist
							return mkdir(path.dirname(fullPath), {recursive: true})
									.then(() => writeFile(fullPath, data));
						} else {  // Errors we can't deal with
							reject(err);
						}
					})
					.then(() => resolve())
					.catch(err => reject(err));
		});
	}


	remove(filePath) {
		return unlink(path.resolve(this.basePath,
				filePath.replace(/\/$/, '')));
	}
};
