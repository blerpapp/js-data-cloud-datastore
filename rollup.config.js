var babel = require('rollup-plugin-babel');

module.exports = {
  external: [
    'gcloud',
    'js-data',
    'js-data-adapter'
  ],
  plugins: [
    babel({
      babelrc: false,
      presets: [
        'es2015-rollup'
      ],
      exclude: 'node_modules/**'
    })
  ]
};
