'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var jsData = require('js-data');
var gcloud = _interopDefault(require('gcloud'));
var jsDataAdapter = require('js-data-adapter');

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

var __super__ = jsDataAdapter.Adapter.prototype;

var GCLOUD_DEFAULTS = {
  projectId: process.env.GCLOUD_PROJECT
};

var equal = function equal(query, field, value) {
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
function CloudDatastoreAdapter(opts) {
  jsData.utils.classCallCheck(this, CloudDatastoreAdapter);
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

  jsDataAdapter.Adapter.call(this, opts);

  /**
   * Options to be passed to a new gcloud instance, if one wasn't provided.
   *
   * @name CloudDatastoreAdapter#gcloudOpts
   * @type {Object}
   * @default {}
   * @property {string} projectId Google Cloud Platform project id.
   */
  this.gcloudOpts || (this.gcloudOpts = {});
  jsData.utils.fillIn(this.gcloudOpts, GCLOUD_DEFAULTS);

  /**
   * Override the default predicate functions for the specified operators.
   *
   * @name CloudDatastoreAdapter#operators
   * @type {Object}
   * @default {}
   */
  this.operators || (this.operators = {});
  jsData.utils.fillIn(this.operators, OPERATORS);

  this.gcloud || (this.gcloud = gcloud(this.gcloudOpts));
  this.datastore = this.gcloud.datastore();
}

// Setup prototype inheritance from Adapter
CloudDatastoreAdapter.prototype = Object.create(jsDataAdapter.Adapter.prototype, {
  constructor: {
    value: CloudDatastoreAdapter,
    enumerable: false,
    writable: true,
    configurable: true
  }
});

Object.defineProperty(CloudDatastoreAdapter, '__super__', {
  configurable: true,
  value: jsDataAdapter.Adapter
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
CloudDatastoreAdapter.extend = jsData.utils.extend;

jsData.utils.addHiddenPropsToTarget(CloudDatastoreAdapter.prototype, {
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

  filterQuery: function filterQuery(dsQuery, query, opts) {
    var _this = this;

    query = jsData.utils.plainCopy(query || {});
    opts || (opts = {});
    opts.operators || (opts.operators = {});
    query.where || (query.where = {});
    query.orderBy || (query.orderBy = query.sort);
    query.orderBy || (query.orderBy = []);
    query.skip || (query.skip = query.offset);

    // Transform non-keyword properties to "where" clause configuration
    jsData.utils.forOwn(query, function (config, keyword) {
      if (jsDataAdapter.reserved.indexOf(keyword) === -1) {
        if (jsData.utils.isObject(config)) {
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
      jsData.utils.forOwn(query.where, function (criteria, field) {
        if (!jsData.utils.isObject(criteria)) {
          query.where[field] = {
            '==': criteria
          };
        }

        jsData.utils.forOwn(criteria, function (value, operator) {
          var isOr = false;
          var _operator = operator;
          if (_operator && _operator[0] === '|') {
            _operator = _operator.substr(1);
            isOr = true;
          }
          var predicateFn = _this.getOperator(_operator, opts);
          if (predicateFn) {
            if (isOr) {
              throw new Error('Operator ' + operator + ' not supported!');
            } else {
              dsQuery = predicateFn(dsQuery, field, value);
            }
          } else {
            throw new Error('Operator ' + operator + ' not supported!');
          }
        });
      });
    }

    // Apply sort
    if (query.orderBy) {
      if (jsData.utils.isString(query.orderBy)) {
        query.orderBy = [[query.orderBy, 'asc']];
      }
      query.orderBy.forEach(function (clause) {
        if (jsData.utils.isString(clause)) {
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
  _count: function _count(mapper, query, opts) {
    var _this2 = this;

    opts || (opts = {});
    query || (query = {});

    return new jsData.utils.Promise(function (resolve, reject) {
      var dsQuery = _this2.datastore.createQuery(_this2.getKind(mapper, opts));
      dsQuery = _this2.filterQuery(dsQuery, query, opts).select('__key__');
      _this2.datastore.runQuery(dsQuery, function (err, entities) {
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
  _createHelper: function _createHelper(mapper, records) {
    var _this3 = this;

    var singular = !jsData.utils.isArray(records);
    if (singular) {
      records = [records];
    }
    records = jsData.utils.plainCopy(records);
    return new jsData.utils.Promise(function (resolve, reject) {
      var apiResponse = void 0;
      var idAttribute = mapper.idAttribute;
      var incompleteKey = _this3.datastore.key([mapper.name]);

      _this3.datastore.runInTransaction(function (transaction, done) {
        // Allocate ids
        transaction.allocateIds(incompleteKey, records.length, function (err, keys) {
          if (err) {
            return reject(err);
          }
          var entities = records.map(function (_record, i) {
            jsData.utils.set(_record, idAttribute, keys[i].path[1]);
            return {
              key: keys[i],
              data: _record
            };
          });
          // Save records
          _this3.datastore.save(entities, function (err, _apiResponse) {
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
   * @method CloudDatastoreAdapter#_create
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} props The record to be created.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _create: function _create(mapper, props, opts) {
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
  _createMany: function _createMany(mapper, props, opts) {
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
  _destroy: function _destroy(mapper, id) {
    var _this4 = this;

    return new jsData.utils.Promise(function (resolve, reject) {
      _this4.datastore.delete(_this4.datastore.key([mapper.name, id]), function (err, apiResponse) {
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
  _destroyAll: function _destroyAll(mapper, query, opts) {
    var _this5 = this;

    return new jsData.utils.Promise(function (resolve, reject) {
      var dsQuery = _this5.datastore.createQuery(_this5.getKind(mapper, opts));
      dsQuery = _this5.filterQuery(dsQuery, query, opts);
      dsQuery = dsQuery.select('__key__');
      _this5.datastore.runQuery(dsQuery, function (err, entities) {
        if (err) {
          return reject(err);
        }
        var keys = entities.map(function (entity) {
          return entity.key;
        });
        _this5.datastore.delete(keys, function (err, apiResponse) {
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
  _find: function _find(mapper, id, opts) {
    var _this6 = this;

    return new jsData.utils.Promise(function (resolve, reject) {
      var key = _this6.datastore.key([_this6.getKind(mapper, opts), id]);
      _this6.datastore.get(key, function (err, entity) {
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
  _findAll: function _findAll(mapper, query, opts) {
    var _this7 = this;

    return new jsData.utils.Promise(function (resolve, reject) {
      var dsQuery = _this7.datastore.createQuery(_this7.getKind(mapper, opts));
      dsQuery = _this7.filterQuery(dsQuery, query, opts);
      _this7.datastore.runQuery(dsQuery, function (err, entities) {
        if (err) {
          return reject(err);
        }
        return resolve([entities ? entities.map(function (entity) {
          return entity.data;
        }) : [], {}]);
      });
    });
  },
  _sum: function _sum(mapper, field, query, opts) {
    var _this8 = this;

    if (!jsData.utils.isString(field)) {
      throw new Error('field must be a string!');
    }
    opts || (opts = {});
    query || (query = {});
    var canSelect = !Object.keys(query).length;

    return new jsData.utils.Promise(function (resolve, reject) {
      var dsQuery = _this8.datastore.createQuery(_this8.getKind(mapper, opts));
      dsQuery = _this8.filterQuery(dsQuery, query, opts);
      if (canSelect) {
        dsQuery = dsQuery.select(field);
      }
      _this8.datastore.runQuery(dsQuery, function (err, entities) {
        if (err) {
          return reject(err);
        }
        var sum = entities.reduce(function (sum, entity) {
          return sum + (entity.data[field] || 0);
        }, 0);
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
  _updateHelper: function _updateHelper(mapper, records, props, opts) {
    var _this9 = this;

    var singular = !jsData.utils.isArray(records);
    if (singular) {
      records = [records];
      props = [props];
    }
    return new jsData.utils.Promise(function (resolve, reject) {
      if (!records.length) {
        return resolve([singular ? undefined : [], {}]);
      }
      var idAttribute = mapper.idAttribute;
      var entities = [];
      var _records = [];
      records.forEach(function (record, i) {
        if (!record) {
          return;
        }
        var id = jsData.utils.get(record, idAttribute);
        if (!jsData.utils.isUndefined(id)) {
          jsData.utils.deepMixIn(record, props[i]);
          entities.push({
            method: 'update',
            key: _this9.datastore.key([_this9.getKind(mapper, opts), id]),
            data: record
          });
          _records.push(record);
        }
      });
      if (!_records.length) {
        return resolve([singular ? undefined : [], {}]);
      }
      _this9.datastore.save(entities, function (err, apiResponse) {
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
  _update: function _update(mapper, id, props, opts) {
    var _this10 = this;

    props || (props = {});
    return this._find(mapper, id, opts).then(function (result) {
      if (result[0]) {
        props = jsData.utils.plainCopy(props);
        return _this10._updateHelper(mapper, result[0], props, opts);
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
  _updateAll: function _updateAll(mapper, props, query, opts) {
    var _this11 = this;

    props || (props = {});
    return this._findAll(mapper, query, opts).then(function (result) {
      var _result = babelHelpers.slicedToArray(result, 1);

      var records = _result[0];

      records = records.filter(function (record) {
        return record;
      });
      if (records.length) {
        props = jsData.utils.plainCopy(props);
        return _this11._updateHelper(mapper, records, records.map(function () {
          return props;
        }), opts);
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
  _updateMany: function _updateMany(mapper, records, opts) {
    var _this12 = this;

    records || (records = []);
    var idAttribute = mapper.idAttribute;
    var tasks = records.map(function (record) {
      return _this12._find(mapper, jsData.utils.get(record, idAttribute), opts);
    });
    return jsData.utils.Promise.all(tasks).then(function (results) {
      var _records = results.map(function (result) {
        return result[0];
      });
      _records.forEach(function (record, i) {
        if (!record) {
          records[i] = undefined;
        }
      });
      _records = _records.filter(function (record) {
        return record;
      });
      records = records.filter(function (record) {
        return record;
      });
      if (_records.length) {
        records = jsData.utils.plainCopy(records);
        return _this12._updateHelper(mapper, _records, records, opts);
      }
      return [[], {}];
    });
  },
  loadBelongsTo: function loadBelongsTo(mapper, def, records, __opts) {
    if (jsData.utils.isObject(records) && !jsData.utils.isArray(records)) {
      return __super__.loadBelongsTo.call(this, mapper, def, records, __opts);
    }
    throw new Error('findAll with belongsTo not supported!');
  },
  loadHasMany: function loadHasMany(mapper, def, records, __opts) {
    if (jsData.utils.isObject(records) && !jsData.utils.isArray(records)) {
      return __super__.loadHasMany.call(this, mapper, def, records, __opts);
    }
    throw new Error('findAll with hasMany not supported!');
  },
  loadHasOne: function loadHasOne(mapper, def, records, __opts) {
    if (jsData.utils.isObject(records) && !jsData.utils.isArray(records)) {
      return __super__.loadHasOne.call(this, mapper, def, records, __opts);
    }
    throw new Error('findAll with hasOne not supported!');
  },
  loadHasManyLocalKeys: function loadHasManyLocalKeys() {
    throw new Error('find/findAll with hasMany & localKeys not supported!');
  },
  loadHasManyForeignKeys: function loadHasManyForeignKeys() {
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
  getKind: function getKind(mapper, opts) {
    opts || (opts = {});
    return jsData.utils.isUndefined(opts.kind) ? jsData.utils.isUndefined(mapper.kind) ? mapper.name : mapper.kind : opts.kind;
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
  getOperator: function getOperator(operator, opts) {
    opts || (opts = {});
    opts.operators || (opts.operators = {});
    var ownOps = this.operators || {};
    return jsData.utils.isUndefined(opts.operators[operator]) ? ownOps[operator] || OPERATORS[operator] : opts.operators[operator];
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
var version = {
  beta: 1,
  full: '1.0.0-beta.1',
  major: 1,
  minor: 0,
  patch: 0
};

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

exports.OPERATORS = OPERATORS;
exports.CloudDatastoreAdapter = CloudDatastoreAdapter;
exports.version = version;
//# sourceMappingURL=js-data-cloud-datastore.js.map