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
import Adapter from 'js-data-adapter';
import {
  reserved
} from 'js-data-adapter';

const {
  addHiddenPropsToTarget,
  classCallCheck,
  deepMixIn,
  extend,
  forOwn,
  get,
  isArray,
  isObject,
  isString,
  isUndefined,
  omit,
  plainCopy,
  set
} = utils;

const withoutRelations = function (mapper, props) {
  return omit(props, mapper.relationFields || []);
};

const equal = function (query, field, value) {
  return query.filter(field, '=', value);
};

const __super__ = Adapter.prototype;

/**
 * Default predicate functions for the filtering operators.
 *
 * @name CloudDatastoreAdapter.OPERATORS
 * @property {Function} == Equality operator.
 * @property {Function} > "Greater than" operator.
 * @property {Function} >= "Greater than or equal to" operator.
 * @property {Function} < "Less than" operator.
 * @property {Function} <= "Less than or equal to" operator.
 */
const OPERATORS = {
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
 * import CloudDatastoreAdapter from 'js-data-cloud-datastore'
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
 * @param {Object} [opts] Configuration opts.
 * @param {string} [opts.basePath=''] TODO
 * @param {boolean} [opts.debug=false] TODO
 */
export default function CloudDatastoreAdapter (opts) {
  const self = this;
  classCallCheck(self, CloudDatastoreAdapter);
  opts || (opts = {});
  Adapter.call(self, opts);

  /**
   * Override the default predicate functions for specified operators.
   *
   * @name CloudDatastoreAdapter#operators
   * @type {Object}
   * @default {}
   */
  self.operators || (self.operators = {});

  /**
   * Instance of gcloud used by this adapter.
   *
   * @name CloudDatastoreAdapter#gcloud
   * @type {Object}
   */
  self.gcloud = require('gcloud')(opts.gcloud || {
    projectId: process.env.GCLOUD_PROJECT
  });

  /**
   * Instance of gcloud.datastore.dataset used by this adapter.
   *
   * @name CloudDatastoreAdapter#dataset
   * @type {Object}
   */
  self.dataset = self.gcloud.datastore.dataset();
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
 * @name CloudDatastoreAdapter.extend
 * @method
 * @param {Object} [instanceProps] Properties that will be added to the
 * prototype of the CloudDatastoreAdapter.
 * @param {Object} [classProps] Properties that will be added as static
 * properties to the CloudDatastoreAdapter itself.
 * @return {Object} CloudDatastoreAdapter of `CloudDatastoreAdapter`.
 */
CloudDatastoreAdapter.extend = extend;

addHiddenPropsToTarget(CloudDatastoreAdapter.prototype, {
  /**
   * Apply the specified selection query to the provided Datastore query.
   *
   * @name CloudDatastoreAdapter#filterSequence
   * @method
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
  filterQuery (mapper, query, opts) {
    const self = this;
    let dsQuery;

    if (opts && opts.query) {
      dsQuery = opts.query;
    }
    query = plainCopy(query || {});
    opts || (opts = {});
    opts.operators || (opts.operators = {});
    query.where || (query.where = {});
    query.orderBy || (query.orderBy = query.sort);
    query.orderBy || (query.orderBy = []);
    query.skip || (query.skip = query.offset);

    // Transform non-keyword properties to "where" clause configuration
    forOwn(query, function (config, keyword) {
      if (reserved.indexOf(keyword) === -1) {
        if (isObject(config)) {
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
      forOwn(query.where, function (criteria, field) {
        if (!isObject(criteria)) {
          query.where[field] = {
            '==': criteria
          };
        }

        forOwn(criteria, function (value, operator) {
          let isOr = false;
          let _operator = operator;
          if (_operator && _operator[0] === '|') {
            _operator = _operator.substr(1);
            isOr = true;
          }
          let predicateFn = self.getOperator(_operator, opts);
          if (predicateFn) {
            const predicateResult = predicateFn(dsQuery, field, value);
            if (isOr) {
              throw new Error(`Operator ${operator} not supported!`);
            } else {
              dsQuery = predicateResult;
            }
          } else {
            throw new Error(`Operator ${operator} not supported!`);
          }
        });
      });
    }

    // Apply sort
    if (query.orderBy) {
      if (isString(query.orderBy)) {
        query.orderBy = [
          [query.orderBy, 'asc']
        ];
      }
      query.orderBy.forEach(function (clause) {
        if (isString(clause)) {
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

  /**
   * Internal method used by CloudDatastoreAdapter#_create and
   * CloudDatastoreAdapter#_createMany.
   *
   * @name CloudDatastoreAdapter#_createHelper
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {(Object|Object[])} records The record or records to be created.
   * @return {Promise}
   */
  _createHelper (mapper, records) {
    const self = this;
    const singular = !isArray(records);
    if (singular) {
      records = [records];
    }
    return new Promise(function (resolve, reject) {
      let apiResponse;
      const idAttribute = mapper.idAttribute;
      const incompleteKey = self.dataset.key([mapper.name]);

      // Remove relations
      records = records.map(function (record) {
        return withoutRelations(mapper, record);
      });

      self.dataset.runInTransaction(function (transaction, done) {
        // Allocate ids
        transaction.allocateIds(incompleteKey, records.length, function (err, keys) {
          if (err) {
            return reject(err);
          }
          const entities = records.map(function (_record, i) {
            set(_record, idAttribute, keys[i].path[1]);
            return {
              key: keys[i],
              data: _record
            };
          });
          // Save records
          self.dataset.save(entities, function (err, _apiResponse) {
            if (err) {
              return reject(err);
            }
            apiResponse = _apiResponse;
            return done();
          });
        });
      }, function (err) {
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
   * @name CloudDatastoreAdapter#_create
   * @method
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
   * @name CloudDatastoreAdapter#_createMany
   * @method
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
   * @name CloudDatastoreAdapter#_destroy
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to destroy.
   * response object.
   * @return {Promise}
   */
  _destroy (mapper, id) {
    const self = this;
    return new Promise(function (resolve, reject) {
      self.dataset.delete(self.dataset.key([mapper.name, id]), function (err, apiResponse) {
        return err ? reject(err) : resolve([undefined, apiResponse]);
      });
    });
  },

  /**
   * Destroy the records that match the selection query. Internal method used by
   * Adapter#destroyAll.
   *
   * @name CloudDatastoreAdapter#_destroyAll
   * @method
   * @private
   * @param {Object} mapper the mapper.
   * @param {Object} [query] Selection query.
   * @return {Promise}
   */
  _destroyAll (mapper, query) {
    const self = this;

    return self.findAll(mapper, query, { raw: false }).then(function (records) {
      if (records.length) {
        return new Promise(function (resolve, reject) {
          const keys = [];
          const idAttribute = mapper.idAttribute;
          records.forEach(function (record) {
            const id = get(record, idAttribute);
            if (!isUndefined(id)) {
              keys.push(self.dataset.key([mapper.name, id]));
            }
          });
          self.dataset.delete(keys, function (err, apiResponse) {
            return err ? reject(err) : resolve([undefined, apiResponse]);
          });
        });
      }
      return [undefined, {}];
    });
  },

  /**
   * Retrieve the record with the given primary key. Internal method used by
   * Adapter#find.
   *
   * @name CloudDatastoreAdapter#_find
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to retrieve.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _find (mapper, id, opts) {
    const self = this;

    return new Promise(function (resolve, reject) {
      const key = self.dataset.key([self.getKind(mapper, opts), id]);
      self.dataset.get(key, function (err, entity) {
        if (err) {
          return reject(err);
        }
        return resolve([entity ? entity.data : undefined, {}]);
      });
    });
  },

  /**
   * Retrieve the records that match the selection query. Internal method used
   * by Adapter#findAll.
   *
   * @name CloudDatastoreAdapter#_findAll
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} [query] Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _findAll (mapper, query, opts) {
    const self = this;

    return new Promise(function (resolve, reject) {
      let dsQuery = self.dataset.createQuery(self.getKind(mapper, opts));
      dsQuery = self.filterQuery(mapper, query, { query: dsQuery });
      self.dataset.runQuery(dsQuery, function (err, entities) {
        if (err) {
          return reject(err);
        }
        return resolve([entities ? entities.map(function (entity) {
          return entity.data;
        }) : [], {}]);
      });
    });
  },

  /**
   * Internal method used by CloudDatastoreAdapter#_update and
   * CloudDatastoreAdapter#_updateAll and CloudDatastoreAdapter#_updateMany.
   *
   * @name CloudDatastoreAdapter#_updateHelper
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {(Object|Object[])} records The record or records to be updated.
   * @param {(Object|Object[])} props The updates to apply to the record(s).
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _updateHelper (mapper, records, props, opts) {
    const self = this;
    const singular = !isArray(records);
    if (singular) {
      records = [records];
      props = [props];
    }
    return new Promise(function (resolve, reject) {
      if (!records.length) {
        return resolve([singular ? undefined : [], {}]);
      }
      const idAttribute = mapper.idAttribute;
      const entities = [];
      const _records = [];
      records.forEach(function (record, i) {
        if (!record) {
          return;
        }
        const id = get(record, idAttribute);
        if (!isUndefined(id)) {
          deepMixIn(record, props[i]);
          entities.push({
            method: 'update',
            key: self.dataset.key([self.getKind(mapper, opts), id]),
            data: withoutRelations(mapper, record)
          });
          _records.push(record);
        }
      });
      if (!_records.length) {
        return resolve([singular ? undefined : [], {}]);
      }
      self.dataset.save(entities, function (err, apiResponse) {
        if (err) {
          return reject(err);
        }
        return resolve([singular ? _records[0] : _records, apiResponse]);
      });
    });
  },

  /**
   * Apply the given update to the record with the specified primary key.
   * Internal method used by Adapter#update.
   *
   * @name CloudDatastoreAdapter#_update
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id The primary key of the record to be updated.
   * @param {Object} props The update to apply to the record.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _update (mapper, id, props, opts) {
    const self = this;
    props || (props = {});

    return self.find(mapper, id, { raw: false }).then(function (record) {
      if (record) {
        return self._updateHelper(mapper, record, props, opts);
      } else {
        throw new Error('Not Found');
      }
    });
  },

  /**
   * Apply the given update to all records that match the selection query.
   * Internal method used by Adapter#updateAll.
   *
   * @name CloudDatastoreAdapter#_updateAll
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} props The update to apply to the selected records.
   * @param {Object} [query] Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _updateAll (mapper, props, query, opts) {
    const self = this;
    props || (props = {});

    return self.findAll(mapper, query, { raw: false }).then(function (records) {
      if (records.length) {
        return self._updateHelper(mapper, records, records.map(function () { return props; }), opts);
      }
      return [[], {}];
    });
  },

  /**
   * Update the given records in a single batch. Internal method used by
   * Adapter#updateMany.
   *
   * @name CloudDatastoreAdapter#_updateMany
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object[]} records The records to update.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _updateMany (mapper, records, opts) {
    const self = this;
    records || (records = []);

    const idAttribute = mapper.idAttribute;

    return Promise.all(records.map(function (record) {
      return self.find(mapper, get(record, idAttribute));
    })).then(function (_records) {
      if (_records.length) {
        return self._updateHelper(mapper, _records, records, opts);
      }
      return [[], {}];
    });
  },

  loadBelongsTo (mapper, def, records, __opts) {
    if (isObject(records) && !isArray(records)) {
      return __super__.loadBelongsTo.call(this, mapper, def, records, __opts);
    }
    throw new Error('findAll with belongsTo not supported!');
  },

  loadHasMany (mapper, def, records, __opts) {
    if (isObject(records) && !isArray(records)) {
      return __super__.loadHasMany.call(this, mapper, def, records, __opts);
    }
    throw new Error('findAll with hasMany not supported!');
  },

  loadHasOne (mapper, def, records, __opts) {
    if (isObject(records) && !isArray(records)) {
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
   * @name CloudDatastoreAdapter#getKind
   * @method
   * @param {Object} mapper The mapper.
   * @param {Object} [opts] Configuration options.
   * @param {Object} [opts.kind] Datastore kind.
   * @return {string} The kind.
   */
  getKind (mapper, opts) {
    opts || (opts = {});
    return isUndefined(opts.kind) ? (isUndefined(mapper.kind) ? mapper.name : mapper.kind) : opts.kind;
  },

  /**
   * Resolve the predicate function for the specified operator based on the
   * given options and this adapter's settings.
   *
   * @name CloudDatastoreAdapter#getOperator
   * @method
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
    return isUndefined(opts.operators[operator]) ? ownOps[operator] || OPERATORS[operator] : opts.operators[operator];
  }
});

CloudDatastoreAdapter.OPERATORS = OPERATORS;
