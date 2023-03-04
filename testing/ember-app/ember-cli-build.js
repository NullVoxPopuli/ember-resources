'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

const packageJson = require('./package');

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    // Add options here
    autoImport: {
      watchDependencies: Object.keys(packageJson.dependencies),
    },
    'ember-cli-babel': {
      enableTypeScriptTransform: true,
    },
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

  const { maybeEmbroider } = require('@embroider/test-setup');

  return maybeEmbroider(app, {
    packageRules: [
      {
        package: 'ember-app',
        // Pre-strict mode, helpers and components are ambiguous
        helpers: {
          '{{step}}': { safeToIgnore: true },
        },
        components: {
          '{{step}}': { safeToIgnore: true },
        },
      },
    ],
  });
};
