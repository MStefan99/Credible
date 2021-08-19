# Credible

Credible is a secure key-value storage for your most sensitive data. With support for JSON, multiple users and nested
keys, it can handle everything you need to keep safe. Credible automatically encrypts everything you save and checks
whether your data has been tampered with.


### Features

- Built-in strong security
- Multiple user support
- Nested keys
- Automatic encryption and tamper detection
- CLI interface and Node.js module


### Usage

*CLI help available at `node ./cli.js --help`*

To start using Credible, include the module:

```js
const credible = require('@mstefan99/credible');
```

By default, Credible stores data in text files, under `/storage` directory. If you want to store data somewhere else
(i.e, in a database), you can pass a different storage provider to Credible.

```js
credible.createUser(username, password, {StorageProvider: MyStorageProvider});
```

