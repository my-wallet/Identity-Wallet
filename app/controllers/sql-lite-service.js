'use strict';

const Promise = require('bluebird');
const electron = require('electron');
const path = require('path');

const countriesList = require('./../../assets/data/country-list.json');
const countryCodesList = require('./../../assets/data/country-codes.json');
const ethTokensList = require('./../../assets/data/eth-tokens.json');
const initialIdAttributeTypeList = require('./../../assets/data/initial-id-attribute-type-list.json');

module.exports = function (app) {

    const controller = function () { };

    const dbFilePath = path.join(app.config.userDataPath, 'IdentityWalletStorage.sqlite');
    const knex = require('knex')({
        client: 'sqlite3',
        useNullAsDefault: true,
        connection: {
            filename: dbFilePath
        }
    });

    /**
     * tables
     */
    function createCountries() {
        return new Promise((resolve, reject) => {
            knex.schema.hasTable('countries').then((exists) => {
                if (!exists) {
                    knex.schema.createTable('countries', (table) => {
                        table.increments('id');
                        table.string('name').unique().notNullable();
                        table.string('code').unique().notNullable();
                        table.string('dialCode').notNullable();
                        table.integer('createdAt').notNullable();
                        table.integer('updatedAt');
                    }).then((resp) => {
                        let promises = [];
                        for (let i in countriesList) {
                            let item = countriesList[i];
                            item.createdAt = new Date().getTime();
                            item.dialCode = item.dial_code;
                            delete item.dial_code;
                            promises.push(insertIntoTable('countries', item));
                        }

                        Promise.all(promises).then(() => {
                            console.log("Table:", "countries", "created.");
                            resolve("countries created");
                        }).catch((error) => {
                            reject(error);
                        });

                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    function createDocuments() {
        return new Promise((resolve, reject) => {
            knex.schema.hasTable('documents').then((exists) => {
                if (!exists) {
                    knex.schema.createTable('documents', (table) => {
                        table.increments('id');
                        table.string('name').notNullable();
                        table.string('mimeType').notNullable();
                        table.integer('size').notNullable();
                        table.binary('buffer').notNullable();
                        table.integer('createdAt').notNullable().defaultTo(new Date().getTime()); // TODO remove default
                        table.integer('updatedAt');
                    }).then((resp) => {
                        console.log("Table:", "documents", "created.");
                        resolve("documents created");
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    function createIdAttributeTypes() {
        return new Promise((resolve, reject) => {
            knex.schema.hasTable('id_attribute_types').then(function (exists) {
                if (!exists) {
                    knex.schema.createTable('id_attribute_types', (table) => {
                        table.string('key').primary();
                        table.string('category').notNullable();
                        table.string('type').notNullable();
                        table.string('entity').notNullable();
                        table.integer('isInitial').defaultTo(0)
                        table.integer('createdAt').notNullable();
                        table.integer('updatedAt');
                    }).then((resp) => {
                        let promises = [];
                        for (let i in initialIdAttributeTypeList) {
                            let item = initialIdAttributeTypeList[i];
                            item.entity = JSON.stringify(item.entity);
                            promises.push(knex('id_attribute_types').insert({ key: item.key, category: item.category, type: item.type, entity: item.entity, isInitial: 1, createdAt: new Date().getTime() }))
                        }
                        Promise.all(promises).then((resp) => {
                            console.log("Table:", "id_attribute_types", "created.");
                            resolve("id_attribute_types created");
                        }).catch((error) => {
                            reject(error);
                        });
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
        });

    }

    function createTokens() {
        return new Promise((resolve, reject) => {
            knex.schema.hasTable('tokens').then(function (exists) {
                if (!exists) {
                    knex.schema.createTable('tokens', (table) => {
                        table.increments('id');
                        table.string('symbol').unique().notNullable();
                        table.integer('decimal').notNullable();
                        table.string('address').notNullable();
                        table.binary('icon');
                        table.integer('isCustom').notNullable().defaultTo(0);
                        table.integer('createdAt').notNullable();
                        table.integer('updatedAt');
                    }).then((resp) => {
                        for (let i in ethTokensList) {
                            let item = ethTokensList[i];
                            insertIntoTable('tokens', { address: item.address, symbol: item.symbol, decimal: item.decimal, createdAt: new Date().getTime() });
                        }
                        console.log("Table:", "tokens", "created.");
                        resolve("tokens created");
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    function createAppSettings() {
        return new Promise((resolve, reject) => {
            knex.schema.hasTable('app_settings').then(function (exists) {
                if (!exists) {
                    knex.schema.createTable('app_settings', (table) => {
                        table.increments('id');
                        table.string('dataFolderPath').notNullable();
                        table.integer('createdAt').notNullable().defaultTo(new Date().getTime()); // TODO remove default
                        table.integer('updatedAt');
                    }).then((resp) => {
                        console.log("Table:", "app_settings", "created.");
                        insertIntoTable('app_settings', { dataFolderPath: electron.app.getPath('userData') }).then(() => {
                            resolve("tokens created");
                        }).catch((error) => {
                            reject(error);
                        });
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    function createGuideSettings() {
        return new Promise((resolve, reject) => {
            knex.schema.hasTable('guide_settings').then(function (exists) {
                if (!exists) {
                    knex.schema.createTable('guide_settings', (table) => {
                        table.increments('id');
                        table.integer('guideShown').defaultTo(0);
                        table.integer('icoAdsShown').defaultTo(0);
                        table.integer('termsAccepted').defaultTo(0);
                        table.integer('createdAt').notNullable().defaultTo(new Date().getTime()); // TODO remove default
                        table.integer('updatedAt');
                    }).then((resp) => {
                        console.log("Table:", "app_settings", "created.");
                        insertIntoTable('guide_settings', { guideShown: 0, icoAdsShown: 0, termsAccepted: 0 }).then(() => {
                            resolve("app_settings created");
                        }).catch((error) => {
                            reject(error);
                        });
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    function createWallet() {
        return new Promise((resolve, reject) => {
            knex.schema.hasTable('wallets').then(function (exists) {
                if (!exists) {
                    knex.schema.createTable('wallets', (table) => {
                        table.increments('id');
                        table.string('name');
                        table.string('publicKey').unique().notNullable();
                        table.string('privateKey');
                        table.string('keystoreFilePath');
                        table.binary('profilePicture');
                        //table.integer('recordState').defaultTo(1);
                        table.integer('createdAt').notNullable(); // TODO remove default
                        table.integer('updatedAt');
                    }).then((resp) => {
                        console.log("Table:", "wallets", "created.");
                        resolve("wallets created");
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    function createIdAttributes() {
        return new Promise((resolve, reject) => {
            knex.schema.hasTable('id_attributes').then(function (exists) {
                if (!exists) {
                    knex.schema.createTable('id_attributes', (table) => {
                        table.increments('id');
                        table.integer('walletId').notNullable().references('wallets.id');
                        table.integer('idAttributeType').notNullable().references('id_attribute_types.key');
                        table.integer('order').defaultTo(0);
                        table.integer('createdAt').notNullable();
                        table.integer('updatedAt');
                    }).then((resp) => {
                        console.log("Table:", "id_attributes", "created.");
                        resolve("id_attributes created");
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    function createIdAttributeItems() {
        return new Promise((resolve, reject) => {
            knex.schema.hasTable('id_attribute_items').then(function (exists) {
                if (!exists) {
                    knex.schema.createTable('id_attribute_items', (table) => {
                        table.increments('id');
                        table.integer('idAttributeId').notNullable().references('id_attributes.id');
                        table.string('name');
                        table.integer('isVerified').notNullable().defaultTo(0);
                        table.integer('order').defaultTo(0);
                        table.integer('createdAt').notNullable();
                        table.integer('updatedAt');
                    }).then((resp) => {
                        console.log("Table:", "id_attribute_items", "created.");
                        resolve("id_attribute_items created");
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    function createIdAttributeValues() {
        return new Promise((resolve, reject) => {
            knex.schema.hasTable('id_attribute_item_values').then(function (exists) {
                if (!exists) {
                    knex.schema.createTable('id_attribute_item_values', (table) => {
                        table.increments('id');
                        table.integer('idAttributeItemId').notNullable().references('id_attribute_items.id');
                        table.integer('documentId').references('documents.id');
                        table.string('staticData');
                        table.integer('order').defaultTo(0);
                        table.integer('createdAt').notNullable();
                        table.integer('updatedAt');
                    }).then((resp) => {
                        console.log("Table:", "id_attribute_item_values", "created.");
                        resolve("id_attribute_item_values created");
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    function createTokenPrices() {
        return new Promise((resolve, reject) => {
            knex.schema.hasTable('token_prices').then(function (exists) {
                if (!exists) {
                    knex.schema.createTable('token_prices', (table) => {
                        table.increments('id');
                        table.string('name').notNullable();
                        table.string('symbol').notNullable().unique();
                        table.string('source');
                        table.decimal('priceUSD');
                        table.decimal('priceBTC');
                        table.decimal('priceETH');
                        table.integer('createdAt').notNullable();
                        table.integer('updatedAt');
                    }).then((resp) => {
                        console.log("Table:", "token_prices", "created.");
                        resolve("token_prices created");
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    function createWalletTokens() {
        return new Promise((resolve, reject) => {
            knex.schema.hasTable('wallet_tokens').then(function (exists) {
                if (!exists) {
                    knex.schema.createTable('wallet_tokens', (table) => {
                        table.increments('id');
                        table.integer('walletId').notNullable().references('wallets.id');
                        table.integer('tokenId').notNullable().references('tokens.id');
                        table.decimal('balance').defaultTo(0);
                        table.integer('recordState').defaultTo(1);
                        table.integer('createdAt').notNullable().defaultTo(new Date().getTime());
                        table.integer('updatedAt');
                    }).then((resp) => {
                        console.log("Table:", "wallet_tokens", "created.");
                        resolve("wallet_tokens created");
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    function createTransactionsHistory() {
        return new Promise((resolve, reject) => {
            knex.schema.hasTable('transactions_history').then(function (exists) {
                if (!exists) {
                    knex.schema.createTable('transactions_history', (table) => {
                        table.increments('id');
                        table.integer('walletId').notNullable().references('wallets.id');
                        table.integer('tokenId').references('tokens.id');
                        table.string('txId').unique().notNullable();
                        table.string('sentTo');
                        table.decimal('value').notNullable();
                        table.integer('timestamp').notNullable();
                        table.integer('blockNumber').notNullable();
                        table.decimal('gas').notNullable();
                        table.string('gasPrice').notNullable();
                        table.integer('createdAt').notNullable().defaultTo(new Date().getTime());
                        table.integer('updatedAt');
                    }).then((resp) => {
                        console.log("Table:", "transactions_history", "created.");
                        resolve("transactions_history created");
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    function createActionLogs() {
        return new Promise((resolve, reject) => {
            knex.schema.hasTable('action_logs').then(function (exists) {
                if (!exists) {
                    knex.schema.createTable('action_logs', (table) => {
                        table.increments('id');
                        table.integer('walletId').notNullable().references('wallets.id');
                        table.string('title');
                        table.string('content');
                        table.integer('createdAt').notNullable().defaultTo(new Date().getTime());
                        table.integer('updatedAt');
                    }).then((resp) => {
                        console.log("Table:", "action_logs", "created.");
                        resolve("action_logs created");
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    function createWalletSettings() {
        return new Promise((resolve, reject) => {
            knex.schema.hasTable('wallet_settings').then(function (exists) {
                if (!exists) {
                    knex.schema.createTable('wallet_settings', (table) => {
                        table.increments('id');
                        table.integer('walletId').notNullable().references('wallets.id');
                        table.integer('sowDesktopNotifications').notNullable().defaultTo(0);
                        table.integer('ERC20TxHistoryLastBlock');
                        table.integer('EthTxHistoryLastBlock');
                        table.integer('createdAt').notNullable().defaultTo(new Date().getTime());
                        table.integer('updatedAt');
                    }).then((resp) => {
                        console.log("Table:", "wallet_settings", "created.");
                        resolve("wallet_settings created");
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * public methods
     */
    controller.prototype.init = () => {
        let promises = [];
        promises.push(createCountries());
        promises.push(createDocuments());
        promises.push(createIdAttributeTypes());
        promises.push(createTokens());
        promises.push(createWallet());
        promises.push(createAppSettings());
        promises.push(createGuideSettings());
        promises.push(createIdAttributes());
        promises.push(createIdAttributeItems());
        promises.push(createIdAttributeValues());
        promises.push(createTokenPrices());
        promises.push(createWalletTokens());
        promises.push(createTransactionsHistory());
        promises.push(createActionLogs());
        promises.push(createWalletSettings());
        return Promise.all(promises)
    }

    /**
     *
     */
    controller.prototype.wallet_new_token_insert = (data, balance, walletId) => {
        data.createdAt = new Date().getTime();
        return new Promise((resolve, reject) => {

            knex.transaction((trx) => {
                knex('tokens')
                    .transacting(trx)
                    .insert(data)
                    .then((resp) => {
                        let id = resp[0];
                        // add wallet tokens
                        return insertIntoTable('wallet_tokens', { walletId: walletId, tokenId: id, balance: balance, recordState: 1, createdAt: new Date().getTime() }, trx);
                    })
                    .then(trx.commit)
                    .catch(trx.rollback);
            }).then((rowData)=>{
                walletTokens_selectById(rowData.id).then((walletData)=>{
                    resolve(walletData);
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }

    /**
     * wallets
     */
    controller.prototype.wallets_insert = (data, basicInfo) => {
        data.createdAt = new Date().getTime();
        return knex.transaction((trx) => {
            knex('wallets')
                .transacting(trx)
                .insert(data)
                .then((resp) => {
                    let id = resp[0];

                    let promises = [];

                    // add wallet settings
                    promises.push(insertIntoTable('wallet_settings', { walletId: id, sowDesktopNotifications: 1, createdAt: new Date().getTime() }, trx));

                    // add wallet tokens
                    promises.push(insertIntoTable('wallet_tokens', { walletId: id, tokenId: 1, createdAt: new Date().getTime() }, trx));

                    return new Promise((resolve, reject) => {
                        Promise.all(promises).then(() => {
                            let idAttributesSavePromises = [];
                            let idAttributeItemsSavePromises = [];
                            let idAttributeItemValuesSavePromises = [];

                            selectTable('id_attribute_types', { isInitial: 1 }, trx).then((idAttributeTypes) => {
                                for (let i in idAttributeTypes) {
                                    let idAttributeType = idAttributeTypes[i];

                                    // add initial id attributes
                                    idAttributesSavePromises.push(insertIntoTable('id_attributes', { walletId: id, idAttributeType: idAttributeType.key, createdAt: new Date().getTime() }, trx).then((idAttribute) => {
                                        idAttributeItemsSavePromises.push(insertIntoTable('id_attribute_items', { idAttributeId: idAttribute.id, isVerified: 0, createdAt: new Date().getTime() }).then((idAttributeItem) => {
                                            let staticData = JSON.stringify({line1: basicInfo[idAttributeType.key]});
                                            idAttributeItemValuesSavePromises.push(insertIntoTable('id_attribute_item_values', { idAttributeItemId: idAttributeItem.id, staticData: staticData, createdAt: new Date().getTime() }));
                                        }));
                                    }));
                                }

                                let finalPromises = [];
                                finalPromises.push(Promise.all(idAttributesSavePromises));
                                finalPromises.push(Promise.all(idAttributeItemsSavePromises));
                                finalPromises.push(Promise.all(idAttributeItemValuesSavePromises));

                                Promise.each(finalPromises, (el) => { return el }).then(() => {
                                    data.id = id;
                                    resolve(data);
                                }).catch((error) => {
                                    reject({ message: "wallets_insert_error", error: error });
                                });

                            }).catch((error) => {
                                reject({ message: "wallets_insert_error", error: error });
                            });
                        }).catch((error) => {
                            reject({ message: "wallets_insert_error", error: error });
                        });
                    });
                })
                .then(trx.commit)
                .catch(trx.rollback);
        });
    }

    controller.prototype.wallets_update = (data) => {
        return updateById('wallets', data);
    }

    controller.prototype.wallets_selectById = (id) => {
        return getById('wallets', id);
    }

    controller.prototype.walletSettings_selectByWalletId = (id) => {
        return selectTable('wallet_settings', { walletId: id });
    }

    controller.prototype.walletSettings_update = (data) => {
        return updateById('wallet_settings', data);
    }

    controller.prototype.wallets_selectByPublicKey = (publicKey) => {
        return new Promise((resolve, reject) => {
            knex('wallets').select().where('publicKey', publicKey).then((rows) => {
                if (rows && rows.length === 1) {
                    resolve(rows[0]);
                } else {
                    resolve(null);
                }
            }).catch((error) => {
                reject({ message: "error_while_updating", error: error });
            });
        });
    }

    controller.prototype.wallets_selectAll = () => {
        return new Promise((resolve, reject) => {
            knex('wallets').select().then((rows) => {
                if (rows && rows.length) {
                    resolve(rows);
                } else {
                    resolve(null);
                }
            }).catch((error) => {
                reject({ message: "error_while_selecting", error: error });
            });
        });
    }

    /**
     * wallet_tokens
     */
    controller.prototype.walletTokens_selectByWalletId = (walletId) => {
        return new Promise((resolve, reject) => {
            let promise = knex('wallet_tokens')
                .select('wallet_tokens.*', 'token_prices.name', 'token_prices.priceUSD', 'tokens.symbol', 'tokens.decimal', 'tokens.address', 'tokens.isCustom')
                .leftJoin('tokens', 'tokenId', 'tokens.id')
                .leftJoin('token_prices', 'tokens.symbol', 'token_prices.symbol')
                .where({ walletId: walletId, recordState: 1 });

            promise.then((rows) => {
                resolve(rows);
            }).catch((error) => {
                reject({ message: "error_while_selecting", error: error });
            });
        });
    }

    function walletTokens_selectById (id)  {
        return new Promise((resolve, reject) => {
            let promise = knex('wallet_tokens')
                .select('wallet_tokens.*', 'token_prices.name', 'token_prices.priceUSD', 'tokens.symbol', 'tokens.decimal', 'tokens.address', 'tokens.isCustom')
                .leftJoin('tokens', 'tokenId', 'tokens.id')
                .leftJoin('token_prices', 'tokens.symbol', 'token_prices.symbol')
                .where({ 'wallet_tokens.id': id, recordState: 1 });

            promise.then((rows) => {
                rows && rows.length ? resolve(rows[0]) : resolve(null);
            }).catch((error) => {
                console.log(error);
                reject({ message: "error_while_selecting", error: error });
            });
        });
    }

    controller.prototype.walletTokens_selectById = walletTokens_selectById;

    /**
     * id_attribute_types
     */
    controller.prototype.idAttributeTypes_insert = (data) => {
        return insertIntoTable('id_attribute_types', data);
    }

    controller.prototype.idAttributeTypes_update = (data) => {
        return updateById('id_attribute_types', data);
    }

    controller.prototype.wallet_tokens_insert = (data) => {
        data.recordState = 1;

        return new Promise((resolve, reject) => {
            insertIntoTable('wallet_tokens', data).then((rowData) => {
                walletTokens_selectById(rowData.id).then((walletData)=>{
                    resolve(walletData);
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }

    controller.prototype.wallet_tokens_update = (data) => {
        return updateById('wallet_tokens', data);
    }

    controller.prototype.idAttributeTypes_add = (data) => {
        return new Promise((resolve, reject) => {
            knex('id_attribute_types').select().where("key", data.key).then((rows) => {
                if (rows && rows.length) {
                    resolve();
                } else {
                    let dataToSave = {
                        key: data.key,
                        type: data.type[0],
                        category: data.category,
                        entity: JSON.stringify(data.entity),
                        createdAt: new Date().getTime()
                    };
                    knex('id_attribute_types').insert(dataToSave).then((insertedIds) => {
                        resolve();
                    }).catch((error) => {
                        console.log(error);
                        reject({ message: "error", error: error });
                    });
                }
            }).catch((error) => {
                reject({ message: "error", error: error });
            });
        });
    }

    controller.prototype.idAttributeTypes_selectAll = () => {
        return new Promise((resolve, reject) => {
            knex('id_attribute_types').select().then((rows) => {
                resolve(rows);
            }).catch((error) => {
                reject({ message: "error_while_selecting", error: error });
            });
        });
    }

    /**
     * id_attributes
     */
    function _select (table, select, where, tx) {
        let query = knex(table);

        if (tx) {
            query = query.transacting(tx);
        }

        query = query.select(select);

        if (where) {
            query = query.where(where);
        }

        return query;
    }

    function _insert (table, args, tx) {
        let query = knex(table);

        if (tx) {
            query = query.transacting(tx);
        }

        return query.insert(args);
    }

    /*
let selectQ = _select(
        'id_attribute_item_values',
        ['id_attribute_item_values.*', 'documents.name as documentFileName', 'id_attribute_items.id', 'id_attributes.id', 'id_attributes.idAttributeType', 'id_attributes.walletId'],
        null,
        null
    );

    selectQ = selectQ
        .leftJoin('id_attribute_items', 'id_attribute_item_values.idAttributeItemId', 'id_attribute_items.id')
        .leftJoin('id_attributes', 'id_attribute_items.idAttributeId', 'id_attributes.id')
        .leftJoin('documents', 'id_attribute_item_values.documentId', 'documents.id')

    selectQ.then((resp)=>{
        console.log(">>>>>>>>>>", resp);
    }).catch((err)=>{
        console.log(">>>>>>>>>>", err);
    })
    */
    controller.prototype.idAttribute_add = (args) => {
        args.createdAt = new Date().getTime();

        return knex.transaction((trx) => {
            let selectPromise = knex('id_attributes').transacting(trx).select().where({'walletId': args.walletId, 'idAttributeType': args.idAttributeType});
            selectPromise.then((rows) => {
                return new Promise((resolve, reject) => {
                    if (rows && rows.length) {
                        reject({ message: "id_attribute_already_exists" });
                    } else {
                        knex('id_attributes').transacting(trx).insert(args).then((insertedIds) => {
                            if (insertedIds) {
                                let idAttributeItem = {
                                    idAttributeId: insertedIds[0],
                                    name: args.idAttributeType,
                                    createdAt: new Date().getTime()
                                }
                                knex('id_attribute_items').transacting(trx).insert(idAttributeItem).then((insertedIds) => {
                                    let idAttributeItemValue = {
                                        idAttributeItemId: insertedIds[0],
                                        createdAt: new Date().getTime()
                                    }
                                    knex('id_attribute_item_values').transacting(trx).insert(idAttributeItemValue).then((insertedIds) => {
                                        if (insertedIds && insertedIds.length) {
                                            knex('id_attribute_item_values').transacting(trx).select().where('id', insertedIds[0]).then((rows) => {
                                                if (rows && rows.length) {
                                                    idAttributes_selectById(idAttributeItem.idAttributeId, trx).then((rows)=>{
                                                        resolve(rows);
                                                    }).catch((error)=>{
                                                        reject({ message: "error", error: error });
                                                    });
                                                } else {
                                                    reject({ message: "error" });
                                                }
                                            }).catch((error) => {
                                                reject({ message: "error", error: error });
                                            })
                                        } else {
                                            reject({ message: "error" });
                                        }
                                    }).catch((error) => {
                                        reject({ message: "error", error: error });
                                    });
                                }).catch((error) => {
                                    reject({ message: "error", error: error });
                                });
                            }
                        }).catch((error) => {
                            reject({ message: "error", error: error });
                        });
                    }
                });
            })
                .then(trx.commit)
                .catch(trx.rollback);
        });
    }

    controller.prototype.idAttribute_delete = (args) => {
        return knex.transaction((trx) => {
            let selectPromise = knex('id_attributes')
                .transacting(trx)
                .select('id_attributes.id as idAttributeId', 'id_attribute_items.id as idAttributeItemId', 'id_attribute_item_values.id as idAttributeItemValueId', 'id_attribute_item_values.documentId as documentId')
                .leftJoin('id_attribute_items', 'id_attributes.id', 'id_attribute_items.idAttributeId')
                .leftJoin('id_attribute_item_values', 'id_attribute_items.id', 'id_attribute_item_values.idAttributeItemId')
                .where('id_attributes.id', args.id);

            selectPromise.then((rows) => {
                return new Promise((resolve, reject) => {
                    let dataToDelete = rows[0];

                    let promises = [];

                    if (dataToDelete.documentId) {
                        promises.push(knex('documents').transacting(trx).del().where('id', dataToDelete.documentId));
                    }

                    if (dataToDelete.idAttributeItemValueId) {
                        promises.push(knex('id_attribute_item_values').transacting(trx).del().where('id', dataToDelete.idAttributeItemValueId));
                    }

                    if (dataToDelete.idAttributeItemId) {
                        promises.push(knex('id_attribute_items').transacting(trx).del().where('id', dataToDelete.idAttributeItemId));
                    }

                    if (dataToDelete.idAttributeId) {
                        promises.push(knex('id_attributes').transacting(trx).del().where('id', dataToDelete.idAttributeId));
                    }

                    Promise.all(promises).then((responses) => {
                        console.log(responses, "22222");
                        resolve();
                    }).catch((error) => {
                        console.log("err", error);
                        reject();
                    });
                });
            })
                .then(trx.commit)
                .catch(trx.rollback);
        });
    }

    controller.prototype.idAttributes_selectAll = (walletId) => {
        return new Promise((resolve, reject) => {
            knex('id_attributes').select().where('walletId', walletId).then((rows) => {
                if (rows && rows.length) {
                    let idAttributes = {};

                    let idAttributeItemPromises = [];
                    let idAttributeItemValuesPromises = [];

                    for (let i in rows) {
                        let idAttribute = rows[i];
                        if (!idAttribute) continue;

                        idAttributes[idAttribute.id] = idAttribute;

                        idAttributeItemPromises.push(selectTable('id_attribute_items', { idAttributeId: idAttribute.id }).then((items) => {
                            idAttributes[idAttribute.id].items = items ? items : [];

                            for (let j in items) {
                                idAttributeItemValuesPromises.push(selectIdAttributeItemValueView({ idAttributeItemId: items[j].id }).then((values) => {
                                    if(values){
                                        for(let i in values){
                                            if(values[i].staticData){
                                                values[i].staticData = JSON.parse(values[i].staticData);
                                            }
                                        }
                                        items[j].values = values;
                                    }else{
                                        items[j].values = []
                                    }
                                }));
                            }
                        }));
                    }

                    Promise.all(idAttributeItemPromises).then((items) => {
                        Promise.all(idAttributeItemValuesPromises).then((values) => {
                            resolve(idAttributes);
                        }).catch((error) => {
                            reject({ message: "error_while_selecting", error: error });
                        });
                    }).catch((error) => {
                        reject({ message: "error_while_selecting", error: error });
                    });
                } else {
                    resolve([]);
                }
            }).catch((error) => {
                reject({ message: "error_while_selecting", error: error });
            });
        });
    }

    controller.prototype.idAttributeItem_add = (args) => {
        return knex.transaction((trx) => {
            args.createdAt = new Date().getTime();

            // name, idAttributeId, createdAt
            knex('id_attributes').transacting(trx).insert(args).then((insertedIdAttributeIds) => {
                knex('id_attribute_item_values').transacting(trx).insert({
                    idAttributeItemId: insertedIdAttributeIds[0],
                    createdAt: new Date().getTime()
                }).then((insertedIdAttributeItemValueIds) => {
                    let selectPromise = knex('id_attribute_item_values').transacting(trx).select().where('id', insertedIdAttributeItemValueIds[0]);
                    selectPromise.then((idAttributeItemValue) => {
                        resolve(idAttributeItemValue);
                    }).catch((error) => {
                        reject({ message: "error", error: error });
                    });
                }).catch((error) => {
                    reject({ message: "error", error: error });
                });
            }).catch((error) => {
                reject({ message: "error", error: error });
            });
        });
    }

    /**
     * id_attribute_item_values
     */
    controller.prototype.idAttributeItemValues_addStaticData = (args) => {
        return knex.transaction((trx) => {
            let selectPromise = knex('id_attribute_item_values').transacting(trx).select().where('id', args.idAttributeItemValueId);
            selectPromise.then((idAttributeItemValues) => {
                return new Promise((resolve, reject) => {
                    if (idAttributeItemValues && idAttributeItemValues.length) {
                        let idAttributeItemValue = idAttributeItemValues[0];

                        // update idAttributeItemValue
                        idAttributeItemValue.updatedAt = new Date().getTime();

                        if (args.staticData) {
                            idAttributeItemValue.staticData = JSON.stringify(staticData);
                        }

                        let updatePromise = knex('id_attribute_item_values').transacting(trx).update(idAttributeItemValue).where('id', idAttributeItemValue.id);
                        updatePromise.then((rows) => {
                            resolve(idAttributeItemValue);
                        }).catch((error) => {
                            reject(error);
                        });
                    } else {
                        reject({message: 'record_not_found'});
                    }
                });
            })
            .then(trx.commit)
            .catch(trx.rollback);
        });
    }

    controller.prototype.idAttributeItemValues_addDocument = (args) => {
        return knex.transaction((trx) => {
            let selectPromise = knex('id_attribute_item_values').transacting(trx).select().where('id', args.idAttributeItemValueId);
            selectPromise.then((idAttributeItemValues) => {
                return new Promise((resolve, reject) => {
                    if (idAttributeItemValues && idAttributeItemValues.length) {
                        let idAttributeItemValue = idAttributeItemValues[0];

                        // update idAttributeItemValue
                        idAttributeItemValue.updatedAt = new Date().getTime();

                        if (idAttributeItemValue.documentId) {
                            let selectPromise = knex('documents').transacting(trx).select().where('id', idAttributeItemValue.documentId);
                            selectPromise.then((documents) => {

                                documents[0].name = args.fileName;
                                documents[0].buffer = args.buffer;
                                documents[0].size = args.size;
                                documents[0].mimeType = args.mimeType;
                                documents[0].updatedAt = new Date().getTime();

                                let updatePromise = knex('documents').transacting(trx).update(documents[0]).where('id', documents[0].id);

                                updatePromise.then((updatedIds) => {
                                    resolve(idAttributeItemValue);
                                }).catch((error) => {
                                    reject(error);
                                })
                            }).catch((error) => {
                                reject(error);
                            });
                        } else {
                            knex('documents').transacting(trx).insert({
                                buffer: args.buffer,
                                name: args.fileName,
                                mimeType: args.mimeType,
                                size: args.size,
                                createdAt: new Date().getTime()
                            }).then((rows) => {
                                idAttributeItemValue.documentId = rows[0];
                                let updatePromise = knex('id_attribute_item_values').transacting(trx).update(idAttributeItemValue).where('id', idAttributeItemValue.id);
                                updatePromise.then((rows) => {
                                    resolve(idAttributeItemValue);
                                }).catch((error) => {
                                    reject(error);
                                });
                            }).catch((error) => {
                                reject(error);
                            });
                        }
                    } else {
                        reject({message: "record_not_found"});
                    }
                });
            })
            .then(trx.commit)
            .catch(trx.rollback);
        });
    }

    controller.prototype.idAttributeItemValues_updateStaticData = (args) => {
        return knex.transaction((trx) => {
            let selectPromise = knex('id_attribute_item_values').transacting(trx).select().where('id', args.id);
            selectPromise.then((rows) => {
                return new Promise((resolve, reject) => {
                    let idAttributeItemValue = rows[0];

                    if(args.staticData){
                        args.staticData = JSON.stringify(args.staticData);
                    }

                    knex('id_attribute_item_values').transacting(trx).update(args).where('id', args.id).then((updatedIds) => {
                        resolve(rows);
                    }).catch((error) => {
                        reject({ message: "error", error: error });
                    });
                });
            })
            .then(trx.commit)
            .catch(trx.rollback);
        });
    }

    controller.prototype.idAttributeItemValues_updateDocument = (args) => {
        return knex.transaction((trx) => {
            let selectPromise = select('id_attribute_item_values', {'id': args.id}, trx);
            selectPromise.then((rows) => {
                return new Promise((resolve, reject) => {
                    let idAttributeItemValue = rows[0];

                    select('documents', {'id': idAttributeItemValue.documentId}, trx).then((documents) => {
                        if (documents && documents.length) {
                            let document = documents[0];

                            document.name = args.name;
                            document.buffer = args.buffer;
                            document.mimeType = args.mimeType;
                            document.size = args.size;
                            document.updatedAt = new Date().getTime();

                            knex('documents').transacting(trx).update(document).where("id", document.id).then((updatedIds) => {
                                resolve(rows);
                            }).catch((error) => {
                                reject({ message: "error", error: error });
                            });
                        } else {
                            let document = {
                                name: args.name,
                                buffer: args.buffer,
                                mimeType: args.mimeType,
                                size: args.size,
                                createdAt: new Date().getTime()
                            }

                            knex('documents').transacting(trx).insert(document).then((insertedIds) => {
                                if (insertedIds && insertedIds.length) {
                                    let updateData = {
                                        documentId: insertedIds[0]
                                    }
                                    knex('id_attribute_item_values').transacting(trx).update(updateData).where('id', args.id).then((updatedIds) => {
                                        resolve(rows);
                                    }).catch((error) => {
                                        reject({ message: "error", error: error });
                                    });
                                } else {
                                    reject({ message: "error" });
                                }
                            }).catch((error) => {
                                reject({ message: "error", error: error });
                            });
                        }
                    }).catch((error) => {
                        reject({ message: "error", error: error });
                    })
                });
            })
            .then(trx.commit)
            .catch(trx.rollback);
        });
    }

    /**
     * documents
     */
    controller.prototype.documents_selectById = (id) => {
        return selectById('documents', id);
    }

    /**
     * action_logs
     */
    controller.prototype.actionLogs_add = (item) => {
        item.createdAt = new Date().getTime();
        //item.content = JSON.stringify(item.content);
        return insertIntoTable('action_logs', item);
    }

    controller.prototype.actionLogs_findAll = (args) => {
        return new Promise((resolve, reject)=>{
            knex('action_logs').select().where({walletId: args.walletId}).then((rows) => {
                resolve(rows);
            }).catch((error) => {
                reject({ message: "error", error: error });
            });
        });
    }

    /**
     * tokens
     */
    controller.prototype.tokens_selectAll = () => {
        return new Promise((resolve, reject) => {
            knex('tokens').select().then((rows) => {
                if (rows && rows.length) {
                    resolve(rows);
                } else {
                    resolve(null);
                }
            }).catch((error) => {
                reject({ message: "error_while_selecting", error: error });
            });
        });
    }

    controller.prototype.tokens_selectBySymbol = (symbol) => {
        return selectTable('tokens', { symbol: 'eth' });
    }

    controller.prototype.token_insert = (data) => {
        return insertIntoTable('tokens', data);
    }

    controller.prototype.token_update = (data) => {
        return updateById('tokens', data);
    }

    /**
     * token_prices
     */
    controller.prototype.tokenPrices_selectAll = () => {
        return new Promise((resolve, reject) => {
            knex('token_prices').select().then((rows) => {
                if (rows && rows.length) {
                    resolve(rows);
                } else {
                    resolve(null);
                }
            }).catch((error) => {
                reject({ message: "error_while_selecting", error: error });
            });
        });
    }

    controller.prototype.tokenPrices_selectBySymbol = (symbol) => {
        return selectTable('token_prices', { symbol: symbol });
    }

    controller.prototype.tokenPrices_insert = (data) => {
        return insertIntoTable('token_prices', data);
    }

    controller.prototype.tokenPrices_update = (data) => {
        return updateById('token_prices', data);
    }

    /**
     * guide_settings
     */
    controller.prototype.guideSettings_selectAll = () => {
        return new Promise((resolve, reject) => {
            knex('guide_settings').select().then((rows) => {
                if (rows && rows.length) {
                    resolve(rows);
                } else {
                    resolve(null);
                }
            }).catch((error) => {
                reject({ message: "error_while_selecting", error: error });
            });
        });
    }

    controller.prototype.guideSettings_update = (data) => {
        return updateById('guide_settings', data);
    }

    /**
     * countries
     */
    controller.prototype.countries_selectAll = () => {
        return new Promise((resolve, reject) => {
            knex('countries').select().then((rows) => {
                if (rows && rows.length) {
                    resolve(rows);
                } else {
                    resolve(null);
                }
            }).catch((error) => {
                reject({ message: "error_while_selecting", error: error });
            });
        });
    }

    /**
     * transactions history
     */
    controller.prototype.transactionsHistory_selectAll = () => {
        return new Promise((resolve, reject) => {
            knex('transactions_history').select().then((rows) => {
                if (rows && rows.length) {
                    resolve(rows);
                } else {
                    resolve([]);
                }
            }).catch((error) => {
                reject({ message: "error_while_selecting", error: error });
            });
        });
    }

    controller.prototype.transactionsHistory_selectByWalletId = (id) => {

        return selectTable('transactions_history', { walletId: id });
    }

    controller.prototype.transactionsHistory_selectByWalletIdAndTokenId = (query) => {
        return selectTable('transactions_history', { walletId: query.walletId, tokenId: query.tokenId });
    }

    /**
    * transactions_history
    */
    controller.prototype.transactionsHistory_insert = (data) => {
        return insertIntoTable('transactions_history', data);
    }


    /**
     *
     */
    function idAttributes_selectById (id, trx) {
        return new Promise((resolve, reject) => {
            knex('id_attributes').transacting(trx).select().where('id', id).then((rows) => {

                let idAttribute = null;

                let idAttributeItemPromises = [];
                let idAttributeItemValuesPromises = [];

                if(!rows || !rows.length) {
                    return reject({message: 'not_found'});
                }

                idAttribute = rows[0];

                idAttributeItemPromises.push(selectTable('id_attribute_items', { idAttributeId: idAttribute.id }, trx).then((items) => {
                    idAttribute.items = items ? items : [];

                    for (let j in items) {
                        idAttributeItemValuesPromises.push(selectIdAttributeItemValueView({ idAttributeItemId: items[j].id }, trx).then((values) => {
                            if(values){
                                for(let i in values){
                                    if(values[i].staticData){
                                        values[i].staticData = JSON.parse(values[i].staticData);
                                    }
                                }
                                items[j].values = values;
                            }else{
                                items[j].values = [];
                            }
                        }));
                    }
                }));

                Promise.all(idAttributeItemPromises).then((items) => {
                    Promise.all(idAttributeItemValuesPromises).then((values) => {
                        resolve(idAttribute);
                    }).catch((error) => {
                        reject({ message: "error_while_selecting", error: error });
                    });
                }).catch((error) => {
                    reject({ message: "error_while_selecting", error: error });
                });
            }).catch((error) => {
                reject({ message: "error_while_selecting", error: error });
            });
        });
    }

    function selectIdAttributeItemValueView(where, tx) {
        return new Promise((resolve, reject) => {
            let promise = null;
            if (tx) {
                promise = knex('id_attribute_item_values')
                    .transacting(tx)
                    .select('id_attribute_item_values.*', 'documents.name as documentFileName', 'id_attribute_items.id as idAttributeItemId', 'id_attributes.id as idAttributeId', 'id_attributes.idAttributeType', 'id_attributes.walletId')
                    .leftJoin('id_attribute_items', 'id_attribute_item_values.idAttributeItemId', 'id_attribute_items.id')
                    .leftJoin('id_attributes', 'id_attribute_items.idAttributeId', 'id_attributes.id')
                    .leftJoin('documents', 'id_attribute_item_values.documentId', 'documents.id')
                    .where(where);
            } else {
                promise = knex('id_attribute_item_values')
                    .select('id_attribute_item_values.*', 'documents.name as documentFileName', 'id_attribute_items.id as idAttributeItemId', 'id_attributes.id as idAttributeId', 'id_attributes.idAttributeType', 'id_attributes.walletId')
                    .leftJoin('id_attribute_items', 'id_attribute_item_values.idAttributeItemId', 'id_attribute_items.id')
                    .leftJoin('id_attributes', 'id_attribute_items.idAttributeId', 'id_attributes.id')
                    .leftJoin('documents', 'id_attribute_item_values.documentId', 'documents.id')
                    .where(where);
            }

            promise.then((rows) => {
                resolve(rows);
            }).catch((error) => {
                reject({ message: "error_while_selecting", error: error });
            });
        });
    }

    function insertIntoTable(table, data, trx) {
        return new Promise((resolve, reject) => {
            let promise = null;
            if (!trx) {
                promise = knex(table).insert(data);
            } else {
                promise = knex(table).transacting(trx).insert(data);
            }

            promise.then((resp) => {
                if (!resp || resp.length !== 1) {
                    return reject({ message: "error_while_creating" });
                }

                let selectPromise = null;

                if (trx) {
                    selectPromise = knex(table).transacting(trx).select().where('id', resp[0])
                } else {
                    selectPromise = knex(table).select().where('id', resp[0])
                }

                selectPromise.then((rows) => {
                    if (rows && rows.length === 1) {
                        resolve(rows[0]);
                    } else {
                        reject({ message: "error_while_creating" });
                    }
                }).catch((error) => {
                    reject({ message: "error_while_creating", error: error });
                });
            }).catch((error) => {
                console.log(error);
                reject({ message: "error_while_creating", error: error });
            })
        });
    }

    function updateById(table, data) {
        return new Promise((resolve, reject) => {
            data.updatedAt = new Date().getTime();
            knex(table).update(data).where('id', '=', data.id).then((resp) => {
                if (!resp || resp !== 1) {
                    return reject({ message: "error_while_updating" });
                }

                knex.select().from(table).where('id', data.id).then((rows) => {
                    if (rows && rows.length === 1) {
                        resolve(rows[0]);
                    } else {
                        reject({ message: "error_while_updating" });
                    }
                }).catch((error) => {
                    reject({ message: "error_while_updating", error: error });
                });
            }).catch((error) => {
                reject({ message: "error_while_updating", error: error });
            })
        });
    }

    // TODO remove
    function getById(table, id) {
        return selectById(table, id);
    }

    function selectById(table, id) {
        return new Promise((resolve, reject) => {
            knex(table).select().where('id', id).then((rows) => {
                rows && rows.length ? resolve(rows[0]) : resolve(null);
            }).catch((error) => {
                reject({ message: "error_while_selecting", error: error });
            });
        });
    }

    // TODO rename to select
    function selectTable(table, where, tx) {
        return select(table, where, tx);
    }

    function select(table, where, tx) {
        return new Promise((resolve, reject) => {
            let promise = null;
            if (tx) {
                promise = knex(table).transacting(tx).select().where(where);
            } else {
                promise = knex(table).select().where(where);
            }

            promise.then((rows) => {
                resolve(rows);
            }).catch((error) => {
                reject({ message: "error_while_selecting", error: error });
            });
        });
    }

    return controller;
};
