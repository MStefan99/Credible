'use strict';

const http = require('http');
const https = require('https');

const argumented = require('@mstefan99/argumented');

const app = require('./lib/WebInterface');
const cli = require('./lib/CLIInterface');


(() => {
	argumented.add('username', ['-u', '--username'], ['username'],
			'Username required for CLI mode');
	argumented.add('password', ['-p', '--password'], ['password'],
			'Password required for CLI mode');
	argumented.add('newPassword', ['-n', '--new-password'], ['newPassword'],
			'New password to set');
	argumented.add('key', ['-k', '--key'], ['key'],
			'Key of the data to save/load');
	argumented.add('schema', ['-c', '--schema'], ['schema'],
			'Schema to use for retrieving data');
	argumented.add('data', ['-d', '--data'], ['data'],
			'Data to store');
	argumented.add('server', ['-s', '--server'], null,
			'Starts a web server to access Credible remotely');
	argumented.add('ip', ['-i', '--ip'], ['ip'],
			'An IP address for the web server to listen on. Implies -s.');
	argumented.add('httpPort', ['--http-port'], ['httpPort'],
			'A port for HTTP server to listen on. Defaults to 80. Implies -s.');
	argumented.add('httpsPort', ['--https-port'], ['httpsPort'],
			'A port for HTTP server to listen on. Defaults to 443. Implies -s.');
	argumented.add('certFile', ['-e', '--cert-file'], ['certFile'],
			'Path to HTTPS certificate file');
	argumented.add('keyFile', ['-y', '--key-file'], ['keyFile'],
			'Path to HTTPS key file');
	const config = argumented.parse();

	if (config.server) {
		const httpPort = +config.httpPort || 80;
		http
				.createServer(app)
				.listen(httpPort, config.ip || '127.0.0.1');
	} else {
		switch (config.positional[0]) {  // Action to perform
			case 'add-user':
				cli.addUser(config.username, config.password);
				break;
			case 'change-password':
				cli.changePassword(config.username, config.password, config.newPassword);
				break;
			case 'remove-user':
				cli.removeUser(config.username, config.password);
				break;
			case 'read-data':
				cli.readData(config.username, config.password, config.key, config.schema);
				break;
			case 'write-data':
				cli.writeData(config.username, config.password, config.key, config.data);
				break;
			case 'remove-data':
				cli.removeData(config.username, config.password, config.key);
				break;
		}
	}
}).call({});
