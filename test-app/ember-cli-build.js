'use strict';

const path = require('path');
const EmberApp = require('ember-cli/lib/broccoli/ember-app');

const packageJson = require('./package');

module.exports = function (defaults) {
  const sideWatch = require('@embroider/broccoli-side-watch');
  let app = new EmberApp(defaults, {
    trees: {
      app: sideWatch('app', { watching: [path.join(__dirname, '../ember-resources')] }),
    },
    // Add options here
    autoImport: {
      watchDependencies: Object.keys(packageJson.dependencies),
    },
    'ember-cli-babel': {
      enableTypeScriptTransform: true,
    },
    name: 'test-app',
  });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  const { Webpack } = require('@embroider/webpack');

  return require('@embroider/compat').compatBuild(app, Webpack, {
    staticAddonTestSupportTrees: true,
    staticAddonTrees: true,
    staticHelpers: true,
    staticModifiers: true,
    staticComponents: true,
    staticEmberSource: true,
    packageRules: [
      {
        package: 'test-app',
        // Pre-strict mode, helpers and components are ambiguous
        helpers: {
          '{{step}}': { safeToIgnore: true },
        },
        components: {
          '{{step}}': { safeToIgnore: true },
        },
      },
    ],
    packagerOptions: {
      webpackConfig: { devtool: 'source-map' },
    },
  });
};
