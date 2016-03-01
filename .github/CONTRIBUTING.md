# Contributing

## Contributor License Agreements

We'd love to accept your sample apps and patches! Before we can take them, we
have to jump a couple of legal hurdles.

Please fill out either the individual or corporate Contributor License Agreement
(CLA).

  * If you are an individual writing original source code and you're sure you
    own the intellectual property, then you'll need to sign an [individual CLA]
    (https://developers.google.com/open-source/cla/individual).
  * If you work for a company that wants to allow you to contribute your work,
    then you'll need to sign a [corporate CLA]
    (https://developers.google.com/open-source/cla/corporate).

Follow either of the two links above to access the appropriate CLA and
instructions for how to sign and return it. Once we receive it, we'll be able to
accept your pull requests.

## Contributing A Patch

1. Submit an issue describing your proposed change to the repo in question.
1. The repo owner will respond to your issue promptly.
1. If your proposed change is accepted, and you haven't already done so, sign a Contributor License Agreement (see details above).
1. Fork the desired repo, develop and test your code changes.
1. Ensure that your code adheres to the existing style in the sample to which you are contributing. Refer to the
   [Google Cloud Platform Samples Style Guide](https://github.com/GoogleCloudPlatform/Template/wiki/style.html) for the
   recommended coding standards for this organization.  You can run `npm run jshint` to match our JavaScript coding standards.
1. Ensure that your code has an appropriate set of unit tests which all pass.
1. Submit a pull request!

## Support

[Find out how to Get Support](http://js-data.io/docs/support).

## Community

[Explore the Community](http://js-data.io/docs/community).

### Have write access?

To cut a release:

1. Checkout master
1. Bump version in `package.json` appropriately
1. Run `npm run release`
1. Update `CHANGELOG.md` appropriately
1. Commit and push changes, including the `dist/` folder
1. Make a GitHub release
  - set tag name to version
  - set release name to version
  - set release body to changelog entry for the version
  - attach the files in the `dist/` folder
1. `npm publish .`
