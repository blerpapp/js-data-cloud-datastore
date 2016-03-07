'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var jsData = require('js-data');
var Adapter = require('js-data-adapter');
var Adapter__default = _interopDefault(Adapter);

var babelHelpers = {};

babelHelpers.slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

babelHelpers;

var addHiddenPropsToTarget = jsData.utils.addHiddenPropsToTarget;
var classCallCheck = jsData.utils.classCallCheck;
var deepMixIn = jsData.utils.deepMixIn;
var extend = jsData.utils.extend;
var forEachRelation = jsData.utils.forEachRelation;
var forOwn = jsData.utils.forOwn;
var get = jsData.utils.get;
var isArray = jsData.utils.isArray;
var isObject = jsData.utils.isObject;
var isString = jsData.utils.isString;
var isUndefined = jsData.utils.isUndefined;
var omit = jsData.utils.omit;
var plainCopy = jsData.utils.plainCopy;
var resolve = jsData.utils.resolve;
var set = jsData.utils.set;


var withoutRelations = function withoutRelations(mapper, props) {
  return omit(props, mapper.relationFields || []);
};

var equal = function equal(query, field, value) {
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
var OPERATORS = {
  '==': equal,
  '===': equal,
  '>': function _(query, field, value) {
    return query.filter(field, '>', value);
  },
  '>=': function _(query, field, value) {
    return query.filter(field, '>=', value);
  },
  '<': function _(query, field, value) {
    return query.filter(field, '<', value);
  },
  '<=': function _(query, field, value) {
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
function CloudDatastoreAdapter(opts) {
  var self = this;
  classCallCheck(self, CloudDatastoreAdapter);
  opts || (opts = {});
  Adapter__default.call(self, opts);

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
CloudDatastoreAdapter.prototype = Object.create(Adapter__default.prototype, {
  constructor: {
    value: CloudDatastoreAdapter,
    enumerable: false,
    writable: true,
    configurable: true
  }
});

Object.defineProperty(CloudDatastoreAdapter, '__super__', {
  configurable: true,
  value: Adapter__default
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

  filterQuery: function filterQuery(mapper, query, opts) {
    var self = this;
    var dsQuery = void 0;

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
      if (Adapter.reserved.indexOf(keyword) === -1) {
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
          var isOr = false;
          var _operator = operator;
          if (_operator && _operator[0] === '|') {
            _operator = _operator.substr(1);
            isOr = true;
          }
          var predicateFn = self.getOperator(_operator, opts);
          if (predicateFn) {
            var predicateResult = predicateFn(dsQuery, field, value);
            if (isOr) {
              throw new Error('Operator ' + operator + ' not supported!');
            } else {
              dsQuery = predicateResult;
            }
          } else {
            throw new Error('Operator ' + operator + ' not supported!');
          }
        });
      });
    }

    if (query.orderBy) {
      if (isString(query.orderBy)) {
        query.orderBy = [[query.orderBy, 'asc']];
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
  _create: function _create(mapper, records, opts) {
    var self = this;
    var singular = !isArray(records);
    if (singular) {
      records = [records];
    }
    return new Promise(function (resolve, reject) {
      var cursor = void 0;
      var idAttribute = mapper.idAttribute;
      var incompleteKey = self.dataset.key([mapper.name]);

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
          var entities = records.map(function (_record, i) {
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
  create: function create(mapper, props, opts) {
    var self = this;
    var op = void 0;
    props || (props = {});
    opts || (opts = {});

    // beforeCreate lifecycle hook
    op = opts.op = 'beforeCreate';
    return resolve(self[op](mapper, props, opts)).then(function (_props) {
      // Allow for re-assignment from lifecycle hook
      props = isUndefined(_props) ? props : _props;
      return self._create(mapper, props, opts);
    }).then(function (result) {
      var _result = babelHelpers.slicedToArray(result, 2);

      var apiResponse = _result[0];
      var record = _result[1];

      var response = new Adapter.Response(record, apiResponse, 'create');
      response.created = record ? 1 : 0;
      response = self.respond(response, opts);

      // afterCreate lifecycle hook
      op = opts.op = 'afterCreate';
      return resolve(self[op](mapper, props, opts, response)).then(function (_response) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_response) ? response : _response;
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
  createMany: function createMany(mapper, props, opts) {
    var self = this;
    var op = void 0;
    props || (props = {});
    opts || (opts = {});

    // beforeCreateMany lifecycle hook
    op = opts.op = 'beforeCreateMany';
    return resolve(self[op](mapper, props, opts)).then(function (_props) {
      // Allow for re-assignment from lifecycle hook
      props = isUndefined(_props) ? props : _props;
      return self._create(mapper, props, opts);
    }).then(function (result) {
      var _result2 = babelHelpers.slicedToArray(result, 2);

      var apiResponse = _result2[0];
      var records = _result2[1];

      var response = new Adapter.Response(records, apiResponse, 'createMany');
      response.created = records.length;
      response = self.respond(response, opts);

      // afterCreateMany lifecycle hook
      op = opts.op = 'afterCreateMany';
      return resolve(self[op](mapper, props, opts, response)).then(function (_response) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_response) ? response : _response;
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
  destroy: function destroy(mapper, id, opts) {
    var self = this;
    var op = void 0;
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
      var response = new Adapter.Response(undefined, apiResponse, 'destroy');
      response = self.respond(response, opts);

      // afterDestroy lifecycle hook
      op = opts.op = 'afterDestroy';
      return resolve(self[op](mapper, id, opts, response)).then(function (_response) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_response) ? response : _response;
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
  destroyAll: function destroyAll(mapper, query, opts) {
    var self = this;
    var idAttribute = mapper.idAttribute;
    var op = void 0;
    query || (query = {});
    opts || (opts = {});

    // beforeDestroyAll lifecycle hook
    op = opts.op = 'beforeDestroyAll';
    return resolve(self[op](mapper, query, opts)).then(function () {
      return self.findAll(mapper, query, { raw: false }).then(function (records) {
        if (records.length) {
          return new Promise(function (resolve, reject) {
            var keys = [];
            records.forEach(function (record) {
              var id = get(record, idAttribute);
              if (!isUndefined(id)) {
                keys.push(self.dataset.key([mapper.name, id]));
              }
            });
            self.dataset.delete(keys, function (err, apiResponse) {
              return err ? reject(err) : resolve(apiResponse);
            });
          });
        }
      });
    }).then(function (apiResponse) {
      apiResponse || (apiResponse = {});
      var response = new Adapter.Response(undefined, apiResponse, 'destroyAll');
      response = self.respond(response, opts);

      // afterDestroyAll lifecycle hook
      op = opts.op = 'afterDestroyAll';
      return resolve(self[op](mapper, query, opts, response)).then(function (_response) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_response) ? response : _response;
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
  find: function find(mapper, id, opts) {
    var self = this;
    opts || (opts = {});
    opts.with || (opts.with = []);
    var op = void 0,
        record = void 0;
    // beforeFind lifecycle hook
    op = opts.op = 'beforeFind';
    return resolve(self[op](mapper, id, opts)).then(function () {
      return new Promise(function (resolve, reject) {
        var key = self.dataset.key([self.getKind(mapper, opts), id]);
        self.dataset.get(key, function (err, entity) {
          if (err) {
            return reject(err);
          }
          return resolve(entity ? entity.data : undefined);
        });
      }).then(function (_record) {
        record = _record;
        var tasks = [];

        forEachRelation(mapper, opts, function (def, __opts) {
          var task = void 0;

          if (def.foreignKey && (def.type === 'hasOne' || def.type === 'hasMany')) {
            if (def.type === 'hasOne') {
              task = self.loadHasOne(mapper, def, record, __opts);
            } else {
              task = self.loadHasMany(mapper, def, record, __opts);
            }
          } else if (def.type === 'hasMany' && def.localKeys) {
            throw new Error('find with hasMany & localKeys not supported!');
          } else if (def.type === 'hasMany' && def.foreignKeys) {
            throw new Error('find with hasMany & foreignKeys not supported!');
          } else if (def.type === 'belongsTo') {
            task = self.loadBelongsTo(mapper, def, record, __opts);
          }

          if (task) {
            tasks.push(task);
          }
        });

        return Promise.all(tasks);
      });
    }).then(function () {
      var response = new Adapter.Response(record, {}, 'find');
      response.found = record ? 1 : 0;
      response = self.respond(response, opts);

      // afterFind lifecycle hook
      op = opts.op = 'afterFind';
      return resolve(self[op](mapper, id, opts, response)).then(function (_response) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_response) ? response : _response;
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
  findAll: function findAll(mapper, query, opts) {
    var self = this;
    opts || (opts = {});
    opts.with || (opts.with = []);
    var op = void 0;
    var records = [];

    // beforeFindAll lifecycle hook
    op = opts.op = 'beforeFindAll';
    return resolve(self[op](mapper, query, opts)).then(function () {
      return new Promise(function (resolve, reject) {
        var dsQuery = self.dataset.createQuery(self.getKind(mapper, opts));
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
        var tasks = [];

        forEachRelation(mapper, opts, function (def, __opts) {
          var task = void 0;

          if (def.foreignKey && (def.type === 'hasOne' || def.type === 'hasMany')) {
            if (def.type === 'hasMany') {
              throw new Error('findAll with hasMany not supported!');
            } else {
              throw new Error('findAll with hasOne not supported!');
            }
          } else if (def.type === 'hasMany' && def.localKeys) {
            throw new Error('findAll with hasMany & localKeys not supported!');
          } else if (def.type === 'hasMany' && def.localKeys) {
            throw new Error('findAll with hasMany & foreignKeys not supported!');
          } else if (def.type === 'belongsTo') {
            throw new Error('findAll with belongsTo not supported!');
          }

          if (task) {
            tasks.push(task);
          }
        });
        return Promise.all(tasks);
      });
    }).then(function () {
      records || (records = []);
      var response = new Adapter.Response(records, {}, 'findAll');
      response.found = records.length;
      response = self.respond(response, opts);

      // afterFindAll lifecycle hook
      op = opts.op = 'afterFindAll';
      return resolve(self[op](mapper, query, opts, response)).then(function (_response) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_response) ? response : _response;
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
  getKind: function getKind(mapper, opts) {
    opts || (opts = {});
    return isUndefined(opts.kind) ? isUndefined(mapper.kind) ? mapper.name : mapper.kind : opts.kind;
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
  getOperator: function getOperator(operator, opts) {
    opts || (opts = {});
    opts.operators || (opts.operators = {});
    var ownOps = this.operators || {};
    return isUndefined(opts.operators[operator]) ? ownOps[operator] || OPERATORS[operator] : opts.operators[operator];
  },
  _update: function _update(mapper, records, props, opts) {
    var self = this;
    var singular = !isArray(records);
    if (singular) {
      records = [records];
      props = [props];
    }
    return new Promise(function (resolve, reject) {
      if (!records.length) {
        return resolve(singular ? undefined : []);
      }
      var idAttribute = mapper.idAttribute;
      var entities = [];
      var _records = [];
      records.forEach(function (record, i) {
        if (!record) {
          return;
        }
        var id = get(record, idAttribute);
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
  update: function update(mapper, id, props, opts) {
    var self = this;
    props || (props = {});
    opts || (opts = {});
    var op = void 0;

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
      var _result3 = babelHelpers.slicedToArray(result, 2);

      var apiResponse = _result3[0];
      var record = _result3[1];

      var response = new Adapter.Response(record, apiResponse, 'update');
      response.updated = 1;
      response = self.respond(response, opts);

      // afterUpdate lifecycle hook
      op = opts.op = 'afterUpdate';
      return resolve(self[op](mapper, id, props, opts, response)).then(function (_response) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_response) ? response : _response;
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
  updateAll: function updateAll(mapper, props, query, opts) {
    var self = this;
    props || (props = {});
    query || (query = {});
    opts || (opts = {});
    var op = void 0;

    // beforeUpdateAll lifecycle hook
    op = opts.op = 'beforeUpdateAll';
    return resolve(self[op](mapper, props, query, opts)).then(function (_props) {
      // Allow for re-assignment from lifecycle hook
      props = isUndefined(_props) ? props : _props;
      return self.findAll(mapper, query).then(function (records) {
        if (records.length) {
          return self._update(mapper, records, records.map(function () {
            return props;
          }), opts);
        }
        return [];
      });
    }).then(function (result) {
      var _result4 = babelHelpers.slicedToArray(result, 2);

      var apiResponse = _result4[0];
      var records = _result4[1];

      apiResponse || (apiResponse = {});
      records || (records = []);
      var response = new Adapter.Response(records, apiResponse, 'updateAll');
      response.updated = records.length;
      response = self.respond(response, opts);

      // afterUpdateAll lifecycle hook
      op = opts.op = 'afterUpdateAll';
      return resolve(self[op](mapper, props, query, opts, response)).then(function (_response) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_response) ? response : _response;
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
  updateMany: function updateMany(mapper, records, opts) {
    var self = this;
    records || (records = []);
    opts || (opts = {});
    var op = void 0;

    // beforeUpdateMany lifecycle hook
    op = opts.op = 'beforeUpdateMany';
    return resolve(self[op](mapper, records, opts)).then(function (_records) {
      // Allow for re-assignment from lifecycle hook
      records = isUndefined(_records) ? records : _records;
      var idAttribute = mapper.idAttribute;
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
      var _result5 = babelHelpers.slicedToArray(result, 2);

      var apiResponse = _result5[0];
      var _records = _result5[1];

      apiResponse || (apiResponse = {});
      _records || (_records = []);
      var response = new Adapter.Response(_records, apiResponse, 'updateMany');
      response.updated = response.data.length;
      response = self.respond(response, opts);

      // afterUpdateMany lifecycle hook
      op = opts.op = 'afterUpdateMany';
      return resolve(self[op](mapper, records, opts, response)).then(function (_response) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_response) ? response : _response;
      });
    });
  }
});

CloudDatastoreAdapter.OPERATORS = OPERATORS;

module.exports = CloudDatastoreAdapter;
//# sourceMappingURL=js-data-cloud-datastore.js.map