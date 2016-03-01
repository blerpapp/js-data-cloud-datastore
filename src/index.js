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
import unique from 'mout/array/unique';

const {
  addHiddenPropsToTarget,
  deepMixIn,
  fillIn,
  forEachRelation,
  forOwn,
  get,
  isArray,
  isObject,
  isString,
  isUndefined,
  plainCopy,
  resolve,
  set
} = utils;

const reserved = [
  'orderBy',
  'sort',
  'limit',
  'offset',
  'skip',
  'where'
];

const noop = function (...args) {
  const self = this;
  const opts = args[args.length - 1];
  self.dbg(opts.op, ...args);
  return resolve();
};

const noop2 = function (...args) {
  const self = this;
  const opts = args[args.length - 2];
  self.dbg(opts.op, ...args);
  return resolve();
};

const withoutRelations = function (mapper, props) {
  const relationFields = mapper.relationFields || [];

  // Remove relations
  const _props = {};
  forOwn(props, function (value, key) {
    if (relationFields.indexOf(key) === -1) {
      _props[key] = value;
    }
  });
  return _props;
};

const DEFAULTS = {
  /**
   * Whether to log debugging information.
   *
   * @name CloudDatastoreAdapter#debug
   * @type {boolean}
   * @default false
   */
  debug: false,

  /**
   * Whether to return a more detailed response object.
   *
   * @name CloudDatastoreAdapter#raw
   * @type {boolean}
   * @default false
   */
  raw: false
};

const equal = function (query, field, value) {
  return query.filter(field, '=', value);
};

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
 * @param {Object} [opts] Configuration opts.
 * @param {string} [opts.basePath=''] TODO
 * @param {boolean} [opts.debug=false] TODO
 */
export default function CloudDatastoreAdapter (opts) {
  const self = this;
  opts || (opts = {});
  fillIn(opts, DEFAULTS);
  fillIn(self, opts);

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

addHiddenPropsToTarget(CloudDatastoreAdapter.prototype, {
  /**
   * @name CloudDatastoreAdapter#afterCreate
   * @method
   */
  afterCreate: noop2,

  /**
   * @name CloudDatastoreAdapter#afterCreateMany
   * @method
   */
  afterCreateMany: noop2,

  /**
   * @name CloudDatastoreAdapter#afterDestroy
   * @method
   */
  afterDestroy: noop2,

  /**
   * @name CloudDatastoreAdapter#afterDestroyAll
   * @method
   */
  afterDestroyAll: noop2,

  /**
   * @name CloudDatastoreAdapter#afterFind
   * @method
   */
  afterFind: noop2,

  /**
   * @name CloudDatastoreAdapter#afterFindAll
   * @method
   */
  afterFindAll: noop2,

  /**
   * @name CloudDatastoreAdapter#afterUpdate
   * @method
   */
  afterUpdate: noop2,

  /**
   * @name CloudDatastoreAdapter#afterUpdateAll
   * @method
   */
  afterUpdateAll: noop2,

  /**
   * @name CloudDatastoreAdapter#afterUpdateMany
   * @method
   */
  afterUpdateMany: noop2,

  /**
   * @name CloudDatastoreAdapter#beforeCreate
   * @method
   */
  beforeCreate: noop,

  /**
   * @name CloudDatastoreAdapter#beforeCreateMany
   * @method
   */
  beforeCreateMany: noop,

  /**
   * @name CloudDatastoreAdapter#beforeDestroy
   * @method
   */
  beforeDestroy: noop,

  /**
   * @name CloudDatastoreAdapter#beforeDestroyAll
   * @method
   */
  beforeDestroyAll: noop,

  /**
   * @name CloudDatastoreAdapter#beforeFind
   * @method
   */
  beforeFind: noop,

  /**
   * @name CloudDatastoreAdapter#beforeFindAll
   * @method
   */
  beforeFindAll: noop,

  /**
   * @name CloudDatastoreAdapter#beforeUpdate
   * @method
   */
  beforeUpdate: noop,

  /**
   * @name CloudDatastoreAdapter#beforeUpdateAll
   * @method
   */
  beforeUpdateAll: noop,

  /**
   * @name CloudDatastoreAdapter#beforeUpdateMany
   * @method
   */
  beforeUpdateMany: noop,

  /**
   * @name CloudDatastoreAdapter#dbg
   * @method
   */
  dbg (...args) {
    this.log('debug', ...args);
  },

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

    // Filter
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

    if (query.skip) {
      dsQuery = dsQuery.offset(+query.skip);
    }

    if (query.limit) {
      dsQuery = dsQuery.limit(+query.limit);
    }

    return dsQuery;
  },

  /**
   * Private method used by create and createMany.
   * @name CloudDatastoreAdapter#create
   * @method
   * @ignore
   * @param {Object} mapper The mapper.
   * @param {(Object|Object[])} records The record or records to be created.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _create (mapper, records, opts) {
    const self = this;
    const singular = !isArray(records);
    if (singular) {
      records = [records];
    }
    return new Promise(function (resolve, reject) {
      let cursor;
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
          self.dataset.save(entities, function (err, _cursor) {
            if (err) {
              return reject(err);
            }
            cursor = _cursor;
            return done();
          });
        });
      }, function (err) {
        if (err) {
          return reject(err);
        }
        return resolve([cursor, singular ? records[0] : records]);
      });
    });
  },

  /**
   * Create a new record.
   *
   * @name CloudDatastoreAdapter#create
   * @method
   * @param {Object} mapper The mapper.
   * @param {Object} props The record to be created.
   * @param {Object} [opts] Configuration options.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @return {Promise}
   */
  create (mapper, props, opts) {
    const self = this;
    let op;
    props || (props = {});
    opts || (opts = {});

    // beforeCreate lifecycle hook
    op = opts.op = 'beforeCreate';
    return resolve(self[op](mapper, props, opts)).then(function (_props) {
      // Allow for re-assignment from lifecycle hook
      _props = isUndefined(_props) ? props : _props;
      return self._create(mapper, _props, opts).then(function (result) {
        let [apiResponse, record] = result;
        apiResponse || (apiResponse = {});
        apiResponse.data = record;
        apiResponse.created = record ? 1 : 0;
        apiResponse = self.getOpt('raw', opts) ? apiResponse : apiResponse.data;

        // afterCreate lifecycle hook
        op = opts.op = 'afterCreate';
        return resolve(self[op](mapper, _props, opts, apiResponse)).then(function (_apiResponse) {
          // Allow for re-assignment from lifecycle hook
          return isUndefined(_apiResponse) ? apiResponse : _apiResponse;
        });
      });
    });
  },

  /**
   * Create multiple records in a single batch.
   *
   * @name CloudDatastoreAdapter#createMany
   * @method
   * @param {Object} mapper The mapper.
   * @param {Array} props Array of records to be created.
   * @param {Object} [opts] Configuration options.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @return {Promise}
   */
  createMany (mapper, props, opts) {
    const self = this;
    let op;
    props || (props = {});
    opts || (opts = {});

    // beforeCreateMany lifecycle hook
    op = opts.op = 'beforeCreateMany';
    return resolve(self[op](mapper, props, opts)).then(function (_props) {
      // Allow for re-assignment from lifecycle hook
      _props = isUndefined(_props) ? props : _props;
      return self._create(mapper, _props, opts).then(function (result) {
        let [apiResponse, records] = result;
        apiResponse || (apiResponse = {});
        records || (records = []);
        apiResponse.data = records;
        apiResponse.created = records.length;
        apiResponse = self.getOpt('raw', opts) ? apiResponse : apiResponse.data;

        // afterCreateMany lifecycle hook
        op = opts.op = 'afterCreateMany';
        return resolve(self[op](mapper, _props, opts, apiResponse)).then(function (_apiResponse) {
          // Allow for re-assignment from lifecycle hook
          return isUndefined(_apiResponse) ? apiResponse : _apiResponse;
        });
      });
    });
  },

  /**
   * Destroy the record with the given primary key.
   *
   * @name CloudDatastoreAdapter#destroy
   * @method
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to destroy.
   * @param {Object} [opts] Configuration options.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @return {Promise}
   */
  destroy (mapper, id, opts) {
    const self = this;
    let op;
    opts || (opts = {});

    // beforeDestroy lifecycle hook
    op = opts.op = 'beforeDestroy';
    return resolve(self[op](mapper, id, opts)).then(function () {
      return new Promise(function (resolve, reject) {
        self.dataset.delete(self.dataset.key([mapper.name, id]), function (err, apiResponse) {
          return err ? reject(err) : resolve(apiResponse);
        });
      });
    }).then(function (apiResponse) {
      if (apiResponse && apiResponse.mutation_result && apiResponse.mutation_result.index_updates) {
        apiResponse.deleted = 1;
      } else {
        apiResponse.deleted = 0;
      }
      apiResponse = self.getOpt('raw', opts) ? apiResponse : undefined;

      // afterDestroy lifecycle hook
      op = opts.op = 'afterDestroy';
      return resolve(self[op](mapper, id, opts, apiResponse)).then(function (_apiResponse) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_apiResponse) ? apiResponse : _apiResponse;
      });
    });
  },

  /**
   * Destroy the records that match the selection `query`.
   *
   * @name CloudDatastoreAdapter#destroyAll
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
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @return {Promise}
   */
  destroyAll (mapper, query, opts) {
    const self = this;
    const idAttribute = mapper.idAttribute;
    let op, deleted;
    let records = [];
    query || (query = {});
    opts || (opts = {});

    // beforeDestroyAll lifecycle hook
    op = opts.op = 'beforeDestroyAll';
    return resolve(self[op](mapper, query, opts)).then(function () {
      return self.findAll(mapper, query, { raw: false }).then(function (_records) {
        records = _records;
        if (records.length) {
          deleted = records.length;
          return new Promise(function (resolve, reject) {
            const keys = [];
            records.forEach(function (record) {
              const id = get(record, idAttribute);
              if (!isUndefined(id)) {
                keys.push(self.dataset.key([mapper.name, id]));
              }
            });
            self.dataset.delete(keys, function (err, apiResponse) {
              return err ? reject(err) : resolve(apiResponse);
            });
          });
        } else {
          deleted = 0;
        }
      });
    }).then(function (apiResponse) {
      if (!apiResponse) {
        apiResponse = {};
      }
      apiResponse.deleted = deleted;
      apiResponse = self.getOpt('raw', opts) ? apiResponse : undefined;

      // afterDestroyAll lifecycle hook
      op = opts.op = 'afterDestroyAll';
      return self[op](mapper, query, opts, apiResponse).then(function (_apiResponse) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_apiResponse) ? apiResponse : _apiResponse;
      });
    });
  },

  /**
   * Retrieve the record with the given primary key.
   *
   * @name CloudDatastoreAdapter#find
   * @method
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to retrieve.
   * @param {Object} [opts] Configuration options.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @param {string[]} [opts.with=[]] Relations to eager load.
   * @return {Promise}
   */
  find (mapper, id, opts) {
    const self = this;
    opts || (opts = {});
    opts.with || (opts.with = []);
    let op, record;
    // beforeFind lifecycle hook
    op = opts.op = 'beforeFind';
    return resolve(self[op](mapper, id, opts)).then(function () {
      return new Promise(function (resolve, reject) {
        const key = self.dataset.key([self.getKind(mapper, opts), id]);
        self.dataset.get(key, function (err, entity) {
          if (err) {
            return reject(err);
          }
          return resolve(entity ? entity.data : undefined);
        });
      }).then(function (_record) {
        record = _record;
        const tasks = [];

        forEachRelation(mapper, opts, function (def, __opts) {
          const relatedMapper = def.getRelation();
          let task;

          if ((def.type === 'hasOne' || def.type === 'hasMany') && def.foreignKey) {
            task = self.findAll(relatedMapper, {
              [def.foreignKey]: get(record, mapper.idAttribute)
            }, __opts).then(function (relatedItems) {
              if (def.type === 'hasOne' && relatedItems.length) {
                set(record, def.localField, relatedItems[0]);
              } else {
                set(record, def.localField, relatedItems);
              }
              return relatedItems;
            });
          } else if (def.type === 'hasMany' && def.localKeys) {
            let localKeys = [];
            let itemKeys = get(record, def.localKeys) || [];
            itemKeys = Array.isArray(itemKeys) ? itemKeys : Object.keys(itemKeys);
            localKeys = localKeys.concat(itemKeys || []);
            task = self.findAll(relatedMapper, {
              where: {
                [relatedMapper.idAttribute]: {
                  'in': unique(localKeys).filter(function (x) { return x; })
                }
              }
            }, __opts).then(function (relatedItems) {
              set(record, def.localField, relatedItems);
              return relatedItems;
            });
          } else if (def.type === 'belongsTo') {
            task = self.find(relatedMapper, get(record, def.foreignKey), __opts).then(function (relatedItem) {
              set(record, def.localField, relatedItem);
              return relatedItem;
            });
          }

          if (task) {
            tasks.push(task);
          }
        });

        return Promise.all(tasks);
      });
    }).then(function () {
      let apiResponse = {
        data: record,
        found: record ? 1 : 0
      };
      apiResponse = self.getOpt('raw', opts) ? apiResponse : apiResponse.data;

      // afterFind lifecycle hook
      op = opts.op = 'afterFind';
      return resolve(self[op](mapper, id, opts, apiResponse)).then(function (_apiResponse) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_apiResponse) ? apiResponse : _apiResponse;
      });
    });
  },

  /**
   * Retrieve the records that match the selection `query`.
   *
   * @name CloudDatastoreAdapter#findAll
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
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @param {string[]} [opts.with=[]] Relations to eager load.
   * @return {Promise}
   */
  findAll (mapper, query, opts) {
    const self = this;
    opts || (opts = {});
    opts.with || (opts.with = []);
    let op;
    let records = [];

    // beforeFindAll lifecycle hook
    op = opts.op = 'beforeFindAll';
    return resolve(self[op](mapper, query, opts)).then(function () {
      return new Promise(function (resolve, reject) {
        let dsQuery = self.dataset.createQuery(self.getKind(mapper, opts));
        dsQuery = self.filterQuery(mapper, query, { query: dsQuery });
        self.dataset.runQuery(dsQuery, function (err, entities) {
          if (err) {
            return reject(err);
          }
          return resolve(entities ? entities.map(function (entity) {
            return entity.data;
          }) : []);
        });
      }).then(function (_records) {
        records = _records;
        const tasks = [];
        const idAttribute = mapper.idAttribute;

        forEachRelation(mapper, opts, function (def, __opts) {
          const relatedMapper = def.getRelation();
          let task;

          if ((def.type === 'hasOne' || def.type === 'hasMany') && def.foreignKey) {
            task = Promise.all(records.map(function (item) {
              return get(item, idAttribute);
            }).filter(function (x) { return x; }).map(function (id) {
              return self.findAll(relatedMapper, {
                where: {
                  [def.foreignKey]: id
                }
              }, __opts);
            })).then(function (results) {
              let relatedItems = [];
              results.forEach(function (_relatedItems) {
                relatedItems = relatedItems.concat(_relatedItems);
              });
              records.forEach(function (item) {
                const attached = [];
                relatedItems.forEach(function (relatedItem) {
                  if (get(relatedItem, def.foreignKey) === get(item, idAttribute)) {
                    attached.push(relatedItem);
                  }
                });
                if (def.type === 'hasOne' && attached.length) {
                  set(item, def.localField, attached[0]);
                } else {
                  set(item, def.localField, attached);
                }
              });
              return relatedItems;
            });
          } else if (def.type === 'hasMany' && def.localKeys) {
            let localKeys = [];
            records.forEach(function (item) {
              let itemKeys = get(item, def.localKeys) || [];
              itemKeys = Array.isArray(itemKeys) ? itemKeys : Object.keys(itemKeys);
              localKeys = localKeys.concat(itemKeys || []);
            });
            task = Promise.all(unique(localKeys).filter(function (x) { return x; }).map(function (id) {
              return self.find(relatedMapper, id, __opts);
            })).then(function (relatedItems) {
              records.forEach(function (item) {
                const attached = [];
                let itemKeys = get(item, def.localKeys) || [];
                itemKeys = Array.isArray(itemKeys) ? itemKeys : Object.keys(itemKeys);
                relatedItems.forEach(function (relatedItem) {
                  if (itemKeys && itemKeys.indexOf(relatedItem[relatedMapper.idAttribute]) !== -1) {
                    attached.push(relatedItem);
                  }
                });
                set(item, def.localField, attached);
              });
              return relatedItems;
            });
          } else if (def.type === 'belongsTo') {
            task = Promise.all(records.map(function (item) {
              return get(item, def.foreignKey);
            }).filter(function (x) { return x; }).map(function (id) {
              return self.find(relatedMapper, id, __opts);
            })).then(function (relatedItems) {
              records.forEach(function (item) {
                relatedItems.forEach(function (relatedItem) {
                  if (relatedItem[relatedMapper.idAttribute] === get(item, def.foreignKey)) {
                    set(item, def.localField, relatedItem);
                  }
                });
              });
              return relatedItems;
            });
          }

          if (task) {
            tasks.push(task);
          }
        });
        return Promise.all(tasks);
      });
    }).then(function () {
      records || (records = []);
      let apiResponse = {
        data: records,
        found: records.length
      };
      apiResponse = self.getOpt('raw', opts) ? apiResponse : apiResponse.data;

      // afterFindAll lifecycle hook
      op = opts.op = 'afterFindAll';
      return resolve(self[op](mapper, query, opts, apiResponse)).then(function (_apiResponse) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_apiResponse) ? apiResponse : _apiResponse;
      });
    });
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
  },

  /**
   * Resolve the value of the specified option based on the given options and
   * this adapter's settings.
   *
   * @name CloudDatastoreAdapter#getOpt
   * @method
   * @param {string} opt The name of the option.
   * @param {Object} [opts] Configuration options.
   * @return {*} The value of the specified option.
   */
  getOpt (opt, opts) {
    opts || (opts = {});
    return isUndefined(opts[opt]) ? plainCopy(this[opt]) : plainCopy(opts[opt]);
  },

  /**
   * Logging utility method.
   *
   * @name CloudDatastoreAdapter#log
   * @method
   */
  log (level, ...args) {
    if (level && !args.length) {
      args.push(level);
      level = 'debug';
    }
    if (level === 'debug' && !this.debug) {
      return;
    }
    const prefix = `${level.toUpperCase()}: (CloudDatastoreAdapter)`;
    if (console[level]) {
      console[level](prefix, ...args);
    } else {
      console.log(prefix, ...args);
    }
  },

  _update (mapper, records, props, opts) {
    const self = this;
    const singular = !isArray(records);
    if (singular) {
      records = [records];
      props = [props];
    }
    return new Promise(function (resolve, reject) {
      if (!records.length) {
        return resolve(singular ? undefined : []);
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
        return resolve(singular ? undefined : []);
      }
      self.dataset.save(entities, function (err, apiResponse) {
        if (err) {
          return reject(err);
        }
        return resolve([apiResponse, singular ? _records[0] : _records]);
      });
    });
  },

  /**
   * Update the records that match the selection `query`. If a record with the
   * specified primary key cannot be found then no update is performed and the
   * promise is resolved with `undefined`.
   *
   * @name CloudDatastoreAdapter#update
   * @method
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id The primary key of the record to be updated.
   * @param {Object} props The update to apply to the record.
   * @param {Object} [opts] Configuration options.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @return {Promise}
   */
  update (mapper, id, props, opts) {
    const self = this;
    props || (props = {});
    opts || (opts = {});
    let op;

    // beforeUpdate lifecycle hook
    op = opts.op = 'beforeUpdate';
    return resolve(self[op](mapper, id, props, opts)).then(function (_props) {
      // Allow for re-assignment from lifecycle hook
      props = isUndefined(_props) ? props : _props;
      return self.find(mapper, id, { raw: false }).then(function (record) {
        if (record) {
          return self._update(mapper, record, props, opts);
        } else {
          throw new Error('Not Found');
        }
      });
    }).then(function (result) {
      let [apiResponse, record] = result;
      apiResponse || (apiResponse = {});
      apiResponse.data = record;
      apiResponse.updated = 1;
      apiResponse = self.getOpt('raw', opts) ? apiResponse : apiResponse.data;

      // afterUpdate lifecycle hook
      op = opts.op = 'afterUpdate';
      return resolve(self[op](mapper, id, props, opts, apiResponse)).then(function (_apiResponse) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_apiResponse) ? apiResponse : _apiResponse;
      });
    });
  },

  /**
   * Update the records that match the selection `query`.
   *
   * @name CloudDatastoreAdapter#updateAll
   * @method
   * @param {Object} mapper The mapper.
   * @param {Object} props The update to apply to the selected records.
   * @param {Object} [query] Selection query.
   * @param {Object} [query.where] Filtering criteria.
   * @param {string|Array} [query.orderBy] Sorting criteria.
   * @param {string|Array} [query.sort] Same as `query.sort`.
   * @param {number} [query.limit] Limit results.
   * @param {number} [query.skip] Offset results.
   * @param {number} [query.offset] Same as `query.skip`.
   * @param {Object} [opts] Configuration options.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @return {Promise}
   */
  updateAll (mapper, props, query, opts) {
    const self = this;
    props || (props = {});
    query || (query = {});
    opts || (opts = {});
    let op;

    // beforeUpdateAll lifecycle hook
    op = opts.op = 'beforeUpdateAll';
    return resolve(self[op](mapper, props, query, opts)).then(function (_props) {
      // Allow for re-assignment from lifecycle hook
      props = isUndefined(_props) ? props : _props;
      return self.findAll(mapper, query).then(function (records) {
        if (records.length) {
          return self._update(mapper, records, records.map(function () { return props; }), opts);
        }
        return [];
      });
    }).then(function (result) {
      let [apiResponse, records] = result;
      apiResponse || (apiResponse = {});
      records || (records = []);
      apiResponse.data = records;
      apiResponse.updated = records.length;
      apiResponse = self.getOpt('raw', opts) ? apiResponse : apiResponse.data;

      // afterUpdateAll lifecycle hook
      op = opts.op = 'afterUpdateAll';
      return resolve(self[op](mapper, props, query, opts, apiResponse)).then(function (_apiResponse) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_apiResponse) ? apiResponse : _apiResponse;
      });
    });
  },

  /**
   * Update the given records in a single batch.
   *
   * @name CloudDatastoreAdapter#updateMany
   * @method
   * @param {Object} mapper The mapper.
   * @param {Object} records The records to update.
   * @param {Object} [opts] Configuration options.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @return {Promise}
   */
  updateMany (mapper, records, opts) {
    const self = this;
    records || (records = []);
    opts || (opts = {});
    let op;

    // beforeUpdateMany lifecycle hook
    op = opts.op = 'beforeUpdateMany';
    return resolve(self[op](mapper, records, opts)).then(function (_records) {
      // Allow for re-assignment from lifecycle hook
      records = isUndefined(_records) ? records : _records;
      const idAttribute = mapper.idAttribute;
      _records = records.filter(function (record) {
        return !isUndefined(get(record, idAttribute));
      });
      return Promise.all(_records.map(function (record) {
        return self.find(mapper, get(record, idAttribute));
      }));
    }).then(function (_records) {
      if (_records.length) {
        return self._update(mapper, _records, records, opts);
      }
      return [];
    }).then(function (result) {
      let [apiResponse, _records] = result;
      apiResponse || (apiResponse = {});
      _records || (_records = []);
      apiResponse.data = _records;
      apiResponse.updated = _records.length;
      apiResponse = self.getOpt('raw', opts) ? apiResponse : apiResponse.data;

      // afterUpdateMany lifecycle hook
      op = opts.op = 'afterUpdateMany';
      return resolve(self[op](mapper, records, opts, apiResponse)).then(function (_apiResponse) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_apiResponse) ? apiResponse : _apiResponse;
      });
    });
  }
});

CloudDatastoreAdapter.OPERATORS = OPERATORS;
