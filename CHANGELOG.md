##### 1.0.0-rc.1 - 23 August 2016

###### Breaking changes
- Now depends on `js-data@3.0.0-rc.4` or greater
- Switched from `gcloud` to `@google-cloud/datastore`

###### Backwards compatible changes
- Updated other dependencies

##### 1.0.0-beta.2 - 28 May 2016

Updated dependencies

##### 1.0.0-beta.1 - 10 May 2016

###### Breaking changes
- Now depends on js-data 3.0.0-beta.5
- Now you must import like this:

    ```js
    // CommonJS
    var JSDataCloudDatastore = require('js-data-cloud-datastore')
    var CloudDatastoreAdapter = JSDataCloudDatastore.CloudDatastoreAdapter
    var adapter = new CloudDatastoreAdapter({...})
    ```

    ```js
    // ES2015 modules
    import {CloudDatastoreAdapter} from 'js-data-cloud-datastore'
    const adapter = new CloudDatastoreAdapter({...})
    ```

###### Other
- Upgraded other dependencies

##### 1.0.0-alpha.3 - 10 March 2016

###### Other
- Moved more common adapter functionality into js-data-adapter

##### 1.0.0-alpha.2 - 08 March 2016

###### Other
- Now using js-data-adapter
- Now using js-data-repo-tools

##### 1.0.0-alpha.1 - 29 February 2016

- Initial release
