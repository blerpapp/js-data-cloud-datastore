// Copyright 2016, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

import {utils} from 'js-data';
import gcloud from 'gcloud';
import {
  Adapter,
  reserved
} from 'js-data-adapter';

const __super__ = Adapter.prototype;

const GCLOUD_DEFAULTS = {
  projectId: process.env.GCLOUD_PROJECT
};

const equal = function (query, field, value) {
  return query.filter(field, '=', value);
};

/**
 * Default predicate functions for the filtering operators.
 *
 * @name module:js-data-cloud-datastore.OPERATORS
 * @property {Function} == Equality operator.
 * @property {Function} > "Greater than" operator.
 * @property {Function} >= "Greater than or equal to" operator.
 * @property {Function} < "Less than" operator.
 * @property {Function} <= "Less than or equal to" operator.
 */
export const OPERATORS = {
  '==': equal,
  '===': equal,
  '>': function (query, field, value) {
    return query.filter(field, '>', value);
  },
  '>=': function (query, field, value) {
    return query.filter(field, '>=', value);
  },
  '<': function (query, field, value) {
    return query.filter(field, '<', value);
  },
  '<=': function (query, field, value) {
    return query.filter(field, '<=', value);
  }
};

/**
 * CloudDatastoreAdapter class.
 *
 * @example
 * // Use Container instead of DataStore on the server
 * import {Container} from 'js-data'
 * import {CloudDatastoreAdapter} from 'js-data-cloud-datastore'
 *
 * // Create a store to hold your Mappers
 * const store = new Container()
 *
 * // Create an instance of CloudDatastoreAdapter with default settings
 * const adapter = new CloudDatastoreAdapter()
 *
 * // Mappers in "store" will use the CloudDatastore adapter by default
 * store.registerAdapter('datastore', adapter, { default: true })
 *
 * // Create a Mapper that maps to a "user" table
 * store.defineMapper('user')
 *
 * @class CloudDatastoreAdapter
 * @extends Adapter
 * @param {Object} [opts] Configuration options.
 * @param {boolean} [opts.debug=false] See {@link Adapter#debug}.
 * @param {Function} [opts.gcloud] See {@link CloudDatastoreAdapter#gcloud}.
 * @param {Object} [opts.gcloudOpts] See {@link CloudDatastoreAdapter#gcloudOpts}.
 * Ignored if you provide a pre-configured gcloud instance.
 * @param {boolean} [opts.raw=false] See {@link Adapter#raw}.
 */
export function CloudDatastoreAdapter (opts) {
  utils.classCallCheck(this, CloudDatastoreAdapter);
  opts || (opts = {});

  // Setup non-enumerable properties
  Object.defineProperties(this, {
    /**
     * Instance of gcloud.datastore used by this adapter. Use this directly when
     * you need to write custom queries.
     *
     * @name CloudDatastoreAdapter#datastore
     * @type {Object}
     */
    datastore: {
      writable: true,
      value: undefined
    },

    /**
     * The gcloud instance used by this adapter. Use this directly when you need
     * to write custom queries.
     *
     * @name CloudDatastoreAdapter#gcloud
     * @type {Object}
     */
    gcloud: {
      writable: true,
      value: undefined
    }
  });

  Adapter.call(this, opts);

  /**
   * Options to be passed to a new gcloud instance, if one wasn't provided.
   *
   * @name CloudDatastoreAdapter#gcloudOpts
   * @type {Object}
   * @default {}
   * @property {string} projectId Google Cloud Platform project id.
   */
  this.gcloudOpts || (this.gcloudOpts = {});
  utils.fillIn(this.gcloudOpts, GCLOUD_DEFAULTS);

  /**
   * Override the default predicate functions for the specified operators.
   *
   * @name CloudDatastoreAdapter#operators
   * @type {Object}
   * @default {}
   */
  this.operators || (this.operators = {});
  utils.fillIn(this.operators, OPERATORS);

  this.gcloud || (this.gcloud = gcloud(this.gcloudOpts));
  this.datastore = this.gcloud.datastore();
}

// Setup prototype inheritance from Adapter
CloudDatastoreAdapter.prototype = Object.create(Adapter.prototype, {
  constructor: {
    value: CloudDatastoreAdapter,
    enumerable: false,
    writable: true,
    configurable: true
  }
});

Object.defineProperty(CloudDatastoreAdapter, '__super__', {
  configurable: true,
  value: Adapter
});

/**
 * Alternative to ES6 class syntax for extending `CloudDatastoreAdapter`.
 *
 * @example <caption>Using the ES2015 class syntax.</caption>
 * class MyCloudDatastoreAdapter extends CloudDatastoreAdapter {...}
 * const adapter = new MyCloudDatastoreAdapter()
 *
 * @example <caption>Using {@link CloudDatastoreAdapter.extend}.</caption>
 * var instanceProps = {...}
 * var classProps = {...}
 *
 * var MyCloudDatastoreAdapter = CloudDatastoreAdapter.extend(instanceProps, classProps)
 * var adapter = new MyCloudDatastoreAdapter()
 *
 * @method CloudDatastoreAdapter.extend
 * @static
 * @param {Object} [instanceProps] Properties that will be added to the
 * prototype of the subclass.
 * @param {Object} [classProps] Properties that will be added as static
 * properties to the subclass itself.
 * @return {Constructor} Subclass of `CloudDatastoreAdapter`.
 */
CloudDatastoreAdapter.extend = utils.extend;

utils.addHiddenPropsToTarget(CloudDatastoreAdapter.prototype, {
  /**
   * Apply the specified selection query to the provided Datastore query.
   *
   * @method CloudDatastoreAdapter#filterQuery
   * @param {Object} mapper The mapper.
   * @param {Object} [query] Selection query.
   * @param {Object} [query.where] Filtering criteria.
   * @param {string|Array} [query.orderBy] Sorting criteria.
   * @param {string|Array} [query.sort] Same as `query.sort`.
   * @param {number} [query.limit] Limit results.
   * @param {number} [query.skip] Offset results.
   * @param {number} [query.offset] Same as `query.skip`.
   * @param {Object} [opts] Configuration options.
   * @param {Object} [opts.operators] Override the default predicate functions
   * for specified operators.
   */
  filterQuery (dsQuery, query, opts) {
    query = utils.plainCopy(query || {});
    opts || (opts = {});
    opts.operators || (opts.operators = {});
    query.where || (query.where = {});
    query.orderBy || (query.orderBy = query.sort);
    query.orderBy || (query.orderBy = []);
    query.skip || (query.skip = query.offset);

    // Transform non-keyword properties to "where" clause configuration
    utils.forOwn(query, (config, keyword) => {
      if (reserved.indexOf(keyword) === -1) {
        if (utils.isObject(config)) {
          query.where[keyword] = config;
        } else {
          query.where[keyword] = {
            '==': config
          };
        }
        delete query[keyword];
      }
    });

    // Apply filter
    if (Object.keys(query.where).length !== 0) {
      utils.forOwn(query.where, (criteria, field) => {
        if (!utils.isObject(criteria)) {
          query.where[field] = {
            '==': criteria
          };
        }

        utils.forOwn(criteria, (value, operator) => {
          let isOr = false;
          let _operator = operator;
          if (_operator && _operator[0] === '|') {
            _operator = _operator.substr(1);
            isOr = true;
          }
          const predicateFn = this.getOperator(_operator, opts);
          if (predicateFn) {
            if (isOr) {
              throw new Error(`Operator ${operator} not supported!`);
            } else {
              dsQuery = predicateFn(dsQuery, field, value);
            }
          } else {
            throw new Error(`Operator ${operator} not supported!`);
          }
        });
      });
    }

    // Apply sort
    if (query.orderBy) {
      if (utils.isString(query.orderBy)) {
        query.orderBy = [
          [query.orderBy, 'asc']
        ];
      }
      query.orderBy.forEach((clause) => {
        if (utils.isString(clause)) {
          clause = [clause, 'asc'];
        }
        dsQuery = clause[1].toUpperCase() === 'DESC' ? dsQuery.order(clause[0], { descending: true }) : dsQuery.order(clause[0]);
      });
    }

    // Apply skip/offset
    if (query.skip) {
      dsQuery = dsQuery.offset(+query.skip);
    }

    // Apply limit
    if (query.limit) {
      dsQuery = dsQuery.limit(+query.limit);
    }

    return dsQuery;
  },

  _count (mapper, query, opts) {
    opts || (opts = {});
    query || (query = {});

    return new utils.Promise((resolve, reject) => {
      let dsQuery = this.datastore.createQuery(this.getKind(mapper, opts));
      dsQuery = this.filterQuery(dsQuery, query, opts).select('__key__');
      this.datastore.runQuery(dsQuery, (err, entities) => {
        if (err) {
          return reject(err);
        }
        return resolve([entities ? entities.length : 0, {}]);
      });
    });
  },

  /**
   * Internal method used by CloudDatastoreAdapter#_create and
   * CloudDatastoreAdapter#_createMany.
   *
   * @method CloudDatastoreAdapter#_createHelper
   * @private
   * @param {Object} mapper The mapper.
   * @param {(Object|Object[])} records The record or records to be created.
   * @return {Promise}
   */
  _createHelper (mapper, records) {
    const singular = !utils.isArray(records);
    if (singular) {
      records = [records];
    }
    records = utils.plainCopy(records);
    return new utils.Promise((resolve, reject) => {
      let apiResponse;
      const idAttribute = mapper.idAttribute;
      const incompleteKey = this.datastore.key([mapper.name]);

      this.datastore.runInTransaction((transaction, done) => {
        // Allocate ids
        transaction.allocateIds(incompleteKey, records.length, (err, keys) => {
          if (err) {
            return reject(err);
          }
          const entities = records.map((_record, i) => {
            utils.set(_record, idAttribute, keys[i].path[1]);
            return {
              key: keys[i],
              data: _record
            };
          });
          // Save records
          this.datastore.save(entities, (err, _apiResponse) => {
            if (err) {
              return reject(err);
            }
            apiResponse = _apiResponse;
            return done();
          });
        });
      }, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve([singular ? records[0] : records, apiResponse]);
      });
    });
  },

  /**
   * Create a new record. Internal method used by Adapter#create.
   *
   * @method CloudDatastoreAdapter#_create
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} props The record to be created.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _create (mapper, props, opts) {
    return this._createHelper(mapper, props, opts);
  },

  /**
   * Create multiple records in a single batch. Internal method used by
   * Adapter#createMany.
   *
   * @method CloudDatastoreAdapter#_createMany
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} props The records to be created.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _createMany (mapper, props, opts) {
    return this._createHelper(mapper, props, opts);
  },

  /**
   * Destroy the record with the given primary key. Internal method used by
   * Adapter#destroy.
   *
   * @method CloudDatastoreAdapter#_destroy
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to destroy.
   * response object.
   * @return {Promise}
   */
  _destroy (mapper, id) {
    return new utils.Promise((resolve, reject) => {
      this.datastore.delete(this.datastore.key([mapper.name, id]), (err, apiResponse) => {
        return err ? reject(err) : resolve([undefined, apiResponse]);
      });
    });
  },

  /**
   * Destroy the records that match the selection query. Internal method used by
   * Adapter#destroyAll.
   *
   * @method CloudDatastoreAdapter#_destroyAll
   * @private
   * @param {Object} mapper the mapper.
   * @param {Object} [query] Selection query.
   * @return {Promise}
   */
  _destroyAll (mapper, query, opts) {
    return new utils.Promise((resolve, reject) => {
      let dsQuery = this.datastore.createQuery(this.getKind(mapper, opts));
      dsQuery = this.filterQuery(dsQuery, query, opts);
      dsQuery = dsQuery.select('__key__');
      this.datastore.runQuery(dsQuery, (err, entities) => {
        if (err) {
          return reject(err);
        }
        const keys = entities.map((entity) => entity.key);
        this.datastore.delete(keys, (err, apiResponse) => {
          if (err) {
            return reject(err);
          }
          resolve([undefined, apiResponse]);
        });
      });
    });
  },

  /**
   * Retrieve the record with the given primary key. Internal method used by
   * Adapter#find.
   *
   * @method CloudDatastoreAdapter#_find
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to retrieve.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _find (mapper, id, opts) {
    return new utils.Promise((resolve, reject) => {
      const key = this.datastore.key([this.getKind(mapper, opts), id]);
      this.datastore.get(key, (err, entity) => {
        return err ? reject(err) : resolve([entity ? entity.data : undefined, {}]);
      });
    });
  },

  /**
   * Retrieve the records that match the selection query. Internal method used
   * by Adapter#findAll.
   *
   * @method CloudDatastoreAdapter#_findAll
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} [query] Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _findAll (mapper, query, opts) {
    return new utils.Promise((resolve, reject) => {
      let dsQuery = this.datastore.createQuery(this.getKind(mapper, opts));
      dsQuery = this.filterQuery(dsQuery, query, opts);
      this.datastore.runQuery(dsQuery, (err, entities) => {
        if (err) {
          return reject(err);
        }
        return resolve([entities ? entities.map((entity) => entity.data) : [], {}]);
      });
    });
  },

  _sum (mapper, field, query, opts) {
    if (!utils.isString(field)) {
      throw new Error('field must be a string!');
    }
    opts || (opts = {});
    query || (query = {});
    const canSelect = !Object.keys(query).length;

    return new utils.Promise((resolve, reject) => {
      let dsQuery = this.datastore.createQuery(this.getKind(mapper, opts));
      dsQuery = this.filterQuery(dsQuery, query, opts);
      if (canSelect) {
        dsQuery = dsQuery.select(field);
      }
      this.datastore.runQuery(dsQuery, (err, entities) => {
        if (err) {
          return reject(err);
        }
        const sum = entities.reduce((sum, entity) => sum + (entity.data[field] || 0), 0);
        return resolve([sum, {}]);
      });
    });
  },

  /**
   * Internal method used by CloudDatastoreAdapter#_update and
   * CloudDatastoreAdapter#_updateAll and CloudDatastoreAdapter#_updateMany.
   *
   * @method CloudDatastoreAdapter#_updateHelper
   * @private
   * @param {Object} mapper The mapper.
   * @param {(Object|Object[])} records The record or records to be updated.
   * @param {(Object|Object[])} props The updates to apply to the record(s).
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _updateHelper (mapper, records, props, opts) {
    const singular = !utils.isArray(records);
    if (singular) {
      records = [records];
      props = [props];
    }
    return new utils.Promise((resolve, reject) => {
      if (!records.length) {
        return resolve([singular ? undefined : [], {}]);
      }
      const idAttribute = mapper.idAttribute;
      const entities = [];
      const _records = [];
      records.forEach((record, i) => {
        if (!record) {
          return;
        }
        const id = utils.get(record, idAttribute);
        if (!utils.isUndefined(id)) {
          utils.deepMixIn(record, props[i]);
          entities.push({
            method: 'update',
            key: this.datastore.key([this.getKind(mapper, opts), id]),
            data: record
          });
          _records.push(record);
        }
      });
      if (!_records.length) {
        return resolve([singular ? undefined : [], {}]);
      }
      this.datastore.save(entities, (err, apiResponse) => {
        return err ? reject(err) : resolve([singular ? _records[0] : _records, apiResponse]);
      });
    });
  },

  /**
   * Apply the given update to the record with the specified primary key.
   * Internal method used by Adapter#update.
   *
   * @method CloudDatastoreAdapter#_update
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id The primary key of the record to be updated.
   * @param {Object} props The update to apply to the record.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _update (mapper, id, props, opts) {
    props || (props = {});
    return this._find(mapper, id, opts).then((result) => {
      if (result[0]) {
        props = utils.plainCopy(props);
        return this._updateHelper(mapper, result[0], props, opts);
      }
      throw new Error('Not Found');
    });
  },

  /**
   * Apply the given update to all records that match the selection query.
   * Internal method used by Adapter#updateAll.
   *
   * @method CloudDatastoreAdapter#_updateAll
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} props The update to apply to the selected records.
   * @param {Object} [query] Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _updateAll (mapper, props, query, opts) {
    props || (props = {});
    return this._findAll(mapper, query, opts).then((result) => {
      let [records] = result;
      records = records.filter((record) => record);
      if (records.length) {
        props = utils.plainCopy(props);
        return this._updateHelper(mapper, records, records.map(() => props), opts);
      }
      return [[], {}];
    });
  },

  /**
   * Update the given records in a single batch. Internal method used by
   * Adapter#updateMany.
   *
   * @method CloudDatastoreAdapter#_updateMany
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object[]} records The records to update.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _updateMany (mapper, records, opts) {
    records || (records = []);
    const idAttribute = mapper.idAttribute;
    const tasks = records.map((record) => this._find(mapper, utils.get(record, idAttribute), opts));
    return utils.Promise.all(tasks).then((results) => {
      let _records = results.map((result) => result[0]);
      _records.forEach((record, i) => {
        if (!record) {
          records[i] = undefined;
        }
      });
      _records = _records.filter((record) => record);
      records = records.filter((record) => record);
      if (_records.length) {
        records = utils.plainCopy(records);
        return this._updateHelper(mapper, _records, records, opts);
      }
      return [[], {}];
    });
  },

  loadBelongsTo (mapper, def, records, __opts) {
    if (utils.isObject(records) && !utils.isArray(records)) {
      return __super__.loadBelongsTo.call(this, mapper, def, records, __opts);
    }
    throw new Error('findAll with belongsTo not supported!');
  },

  loadHasMany (mapper, def, records, __opts) {
    if (utils.isObject(records) && !utils.isArray(records)) {
      return __super__.loadHasMany.call(this, mapper, def, records, __opts);
    }
    throw new Error('findAll with hasMany not supported!');
  },

  loadHasOne (mapper, def, records, __opts) {
    if (utils.isObject(records) && !utils.isArray(records)) {
      return __super__.loadHasOne.call(this, mapper, def, records, __opts);
    }
    throw new Error('findAll with hasOne not supported!');
  },

  loadHasManyLocalKeys () {
    throw new Error('find/findAll with hasMany & localKeys not supported!');
  },

  loadHasManyForeignKeys () {
    throw new Error('find/findAll with hasMany & foreignKeys not supported!');
  },

  /**
   * Resolve the Cloud Datastore kind for the specified Mapper with the given
   * options.
   *
   * @method CloudDatastoreAdapter#getKind
   * @param {Object} mapper The mapper.
   * @param {Object} [opts] Configuration options.
   * @param {Object} [opts.kind] Datastore kind.
   * @return {string} The kind.
   */
  getKind (mapper, opts) {
    opts || (opts = {});
    return utils.isUndefined(opts.kind) ? (utils.isUndefined(mapper.kind) ? mapper.name : mapper.kind) : opts.kind;
  },

  /**
   * Resolve the predicate function for the specified operator based on the
   * given options and this adapter's settings.
   *
   * @method CloudDatastoreAdapter#getOperator
   * @param {string} operator The name of the operator.
   * @param {Object} [opts] Configuration options.
   * @param {Object} [opts.operators] Override the default predicate functions
   * for specified operators.
   * @return {*} The predicate function for the specified operator.
   */
  getOperator (operator, opts) {
    opts || (opts = {});
    opts.operators || (opts.operators = {});
    let ownOps = this.operators || {};
    return utils.isUndefined(opts.operators[operator]) ? ownOps[operator] || OPERATORS[operator] : opts.operators[operator];
  }
});

/**
 * Details of the current version of the `js-data-cloud-datastore` module.
 *
 * @example <caption>ES2015 modules import</caption>
 * import {version} from 'js-data-cloud-datastore'
 * console.log(version.full)
 *
 * @example <caption>CommonJS import</caption>
 * var version = require('js-data-cloud-datastore').version
 * console.log(version.full)
 *
 * @name module:js-data-cloud-datastore.version
 * @type {Object}
 * @property {string} version.full The full semver value.
 * @property {number} version.major The major version number.
 * @property {number} version.minor The minor version number.
 * @property {number} version.patch The patch version number.
 * @property {(string|boolean)} version.alpha The alpha version value,
 * otherwise `false` if the current version is not alpha.
 * @property {(string|boolean)} version.beta The beta version value,
 * otherwise `false` if the current version is not beta.
 */
export const version = '<%= version %>';

/**
 * {@link CloudDatastoreAdapter} class.
 *
 * @example <caption>ES2015 modules import</caption>
 * import {CloudDatastoreAdapter} from 'js-data-cloud-datastore'
 * const adapter = new CloudDatastoreAdapter()
 *
 * @example <caption>CommonJS import</caption>
 * var CloudDatastoreAdapter = require('js-data-cloud-datastore').CloudDatastoreAdapter
 * var adapter = new CloudDatastoreAdapter()
 *
 * @name module:js-data-cloud-datastore.CloudDatastoreAdapter
 * @see CloudDatastoreAdapter
 * @type {Constructor}
 */

/**
 * Registered as `js-data-cloud-datastore` in NPM.
 *
 * @example <caption>Install from NPM</caption>
 * npm i --save js-data-cloud-datastore@beta js-data@beta gcloud
 *
 * @example <caption>ES2015 modules import</caption>
 * import {CloudDatastoreAdapter} from 'js-data-cloud-datastore'
 * const adapter = new CloudDatastoreAdapter()
 *
 * @example <caption>CommonJS import</caption>
 * var CloudDatastoreAdapter = require('js-data-cloud-datastore').CloudDatastoreAdapter
 * var adapter = new CloudDatastoreAdapter()
 *
 * @module js-data-cloud-datastore
 */
