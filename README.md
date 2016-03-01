<img src="https://raw.githubusercontent.com/js-data/js-data/master/js-data.png" alt="js-data logo" title="js-data" align="right" width="96" height="96" />

# js-data-cloud-datastore

[![Slack Status][sl_b]][sl_l]
[![npm version][npm_b]][npm_l]
<!-- [![Circle CI][circle_b]][circle_l] -->
[![npm downloads][dn_b]][dn_l]
<!-- [![Coverage Status][cov_b]][cov_l] -->

Google Cloud Datastore adapter for [js-data](http://www.js-data.io/).

__Note:__ This adapter is in alpha, and uses the 3.0 alpha version of js-data.

## Table of contents

* [Quick start](#quick-start)
* [Guides and Tutorials](#guides-and-tutorials)
* [API Reference Docs](#api-reference-docs)
* [Community](#community)
* [Support](#support)
* [Contributing](#contributing)
* [License](#license)

## Quick Start

```
npm install --save js-data js-data-cloud-datastore gcloud
```

```js
// Use Container instead of DataStore on the server
import {Container} from 'js-data'
import CloudDatastoreAdapter from 'js-data-cloud-datastore'

// Create a store to hold your Mappers
const store = new Container()

// Create an instance of CloudDatastoreAdapter with default settings
const adapter = new CloudDatastoreAdapter()

// Mappers in "store" will use the CloudDatastore adapter by default
store.registerAdapter('datastore', adapter, { default: true })

// Create a Mapper that maps to a "user" kind
store.defineMapper('user')
```

```js
async function findAllAdminUsers () {
  // Find all users where "user.role" == "admin"
  return await store.findAll('user', {
    role: 'admin'
  })
}
```

## Guides and Tutorials

[Get started at http://js-data.io](http://js-data.io)

## API Reference Docs

[Visit http://api.js-data.io](http://api.js-data.io).

## Community

[Explore the Community](http://js-data.io/docs/community).

## Support

[Find out how to Get Support](http://js-data.io/docs/support).

## Contributing

[Read the Contributing Guide](http://js-data.io/docs/contributing).

## License

Apache Version 2.0

Copyright (c) 2014-2016 js-data-cloud-datastore project authors

* [LICENSE](https://github.com/GoogleCloudPlatform/js-data-cloud-datastore/blob/master/LICENSE)
* [AUTHORS](https://github.com/GoogleCloudPlatform/js-data-cloud-datastore/blob/master/AUTHORS)
* [CONTRIBUTORS](https://github.com/GoogleCloudPlatform/js-data-cloud-datastore/blob/master/CONTRIBUTORS)

[sl_b]: http://slack.js-data.io/badge.svg
[sl_l]: http://slack.js-data.io
[npm_b]: https://img.shields.io/npm/v/js-data-cloud-datastore.svg?style=flat
[npm_l]: https://www.npmjs.org/package/js-data-cloud-datastore
[circle_b]: https://img.shields.io/circleci/project/GoogleCloudPlatform/js-data-cloud-datastore/master.svg?style=flat
[circle_l]: https://circleci.com/gh/GoogleCloudPlatform/js-data-cloud-datastore/tree/master
[dn_b]: https://img.shields.io/npm/dm/js-data-cloud-datastore.svg?style=flat
[dn_l]: https://www.npmjs.org/package/js-data-cloud-datastore
[cov_b]: https://img.shields.io/coveralls/GoogleCloudPlatform/js-data-cloud-datastore/master.svg?style=flat
[cov_l]: https://coveralls.io/github/GoogleCloudPlatform/js-data-cloud-datastore?branch=master
