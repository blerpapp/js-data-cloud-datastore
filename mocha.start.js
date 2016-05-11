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

/*global assert:true */

'use strict';

// prepare environment for js-data-adapter-tests
import 'babel-polyfill';

import * as JSData from 'js-data';
import JSDataAdapterTests from 'js-data-adapter-tests';
import * as JSDataCloudDatastore from './src/index';

const assert = global.assert = JSDataAdapterTests.assert;
global.sinon = JSDataAdapterTests.sinon;

const gcloudOpts = {
  projectId: process.env.GCLOUD_PROJECT
};

if (process.env.KEYFILE_PATH) {
  gcloudOpts.keyFilename = process.env.KEYFILE_PATH;
}

JSDataAdapterTests.init({
  debug: false,
  JSData: JSData,
  Adapter: JSDataCloudDatastore.CloudDatastoreAdapter,
  adapterConfig: {
    debug: false,
    gcloudOpts: gcloudOpts
  },
  xfeatures: [
    'findBelongsToNested',
    'findBelongsToHasManyNested',
    'findHasManyLocalKeys',
    'findHasManyForeignKeys',
    'findAllInOp',
    'findAllLikeOp',
    'findAllBelongsTo',
    'findAllBelongsToNested',
    'findAllBelongsToHasMany',
    'findAllBelongsToHasManyNested',
    'filterOnRelations'
  ]
});

describe('exports', function () {
  it('should have correct exports', function () {
    assert(JSDataCloudDatastore.CloudDatastoreAdapter);
    assert(JSDataCloudDatastore.OPERATORS);
    assert(JSDataCloudDatastore.OPERATORS['==']);
    assert(JSDataCloudDatastore.version);
  });
});
