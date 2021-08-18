'use strict';

const AccountManager = require('./AccountManager');
const express = require('express');
const bodyParser = require('body-parser');


const accountManager = new AccountManager;
const app = express();


app.set('x-powered-by', false);
app.use(bodyParser.json());


app.use((req, res, next) => {
	if (!req.get('authorization') || !req.get('authorization').match(':')) {
		res
				.status(400)
				.send('Not authorized');
		return;
	}

	[req.username, req.password] = req.get('authorization').split(':');
	next();
});


app.post('/users', (req, res) => {
	if (req.password.length < 8) {
		res
				.status(400)
				.send('Password too short');
	}

	accountManager.createUser(req.username, req.password)
			.then(() => res.sendStatus(200))
			.catch(() => res.status(422).send('Unable to create user'));
});


app.patch('/users', (req, res) => {
	if (req.body.newPassword?.length < 8) {
		res
				.status(400)
				.send('Password too short');
	}

	accountManager.loadUser(req.username, req.password)
			.catch(() => res.status(422).send('Unable to load user, please check your password'))
			.then(user => user.updatePassword(req.body.newPassword))
			.catch(() => res.sendStatus(422).send('Unable to change password'))
			.then(() => res.sendStatus(200));
});


app.delete('/users', (req, res) => {
	accountManager.loadUser(req.username, req.password)
			.catch(() => res.status(422).send('Unable to load user, please check your password'))
			.then(user => user.remove())
			.catch(() => res.sendStatus(422).send('Unable to remove user'))
			.then(() => res.sendStatus(200));
});


app.use((req, res, next) => {
	if (!req.body.key) {
		res
				.status(400)
				.send('No key provided');
		return;
	}
	next();
});


app.post('/read', (req, res) => {
	if (!req.body.schema) {
		res
				.status(400)
				.send('No schema provided');
		return;
	}

	accountManager.loadUser(req.username, req.password)
			.catch(() => res.status(422).send('Unable to load user, please check your password'))
			.then(user => user.loadData(req.body.key, req.body.schema))
			.catch(() => res.status(422).send('Unable to load data'));
});


app.post('/write', (req, res) => {
	if (!req.body.data) {
		res
				.status(400)
				.send('No data provided');
		return;
	}

	accountManager.loadUser(req.username, req.password)
			.catch(() => res.status(422).send('Unable to load user, please check your password'))
			.then(user => user.saveData(req.body.key, req.body.schema))
			.catch(() => res.status(422).send('Unable to save data'));
});


app.post('/remove', (req, res) => {
	accountManager.loadUser(req.username, req.password)
			.catch(() => res.status(422).send('Unable to load user, please check your password'))
			.then(user => user.removeData(req.body.key))
			.catch(() => res.status(422).send('Unable to save data'));
});


module.exports = app;
