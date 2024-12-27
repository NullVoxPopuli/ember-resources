'use strict';

const getChannelURL = require('ember-source-channel-url');
const { embroiderSafe, embroiderOptimized } = require('@embroider/test-setup');

module.exports = async function () {
  const ember4Deps = {
    'ember-cli': '~4.12.0',
    'ember-maybe-import-regenerator': '^1.0.0',
  };

  const ember5Deps = {
    '@glimmer/component': '^1.1.2',
    '@ember/string': '^3.1.1',
    'ember-resolver': '^11.0.0',
    'ember-auto-import': '^2.3.0',
    'ember-template-lint': '^6.0.0',
    'ember-cli': '^5.12.0',
    'ember-maybe-import-regenerator': null,
    'ember-cli-dependency-checker': null,
    'qunit-dom': '^3.4.0',
  };

  const ember6Deps = {
    ...ember5Deps,
    'ember-cli': '^6.0.0',
    'ember-resolver': '^13.1.0',
    typescript: '^5.7.0',
  };

  return {
    usePnpm: true,
    scenarios: [
      {
        name: 'ember-3.28',
        npm: {
          devDependencies: {
            ...ember4Deps, // close enough, really
            'ember-source': '~3.28.0',
          },
        },
      },
      {
        name: 'ember-4.0.0',
        npm: {
          devDependencies: {
            ...ember4Deps,
            'ember-source': '~4.0.0',
          },
        },
      },
      {
        name: 'ember-4.4',
        npm: {
          devDependencies: {
            ...ember4Deps,
            'ember-source': '~4.4.0',
          },
        },
      },
      {
        name: 'ember-4.8',
        npm: {
          devDependencies: {
            ...ember4Deps,
            'ember-source': '~4.8.0',
          },
        },
      },
      {
        name: 'ember-4.12',
        npm: {
          devDependencies: {
            ...ember4Deps,
            'ember-source': '~4.12.0',
          },
        },
      },
      {
        name: 'ember-5.4',
        npm: {
          devDependencies: {
            ...ember5Deps,
            'ember-source': '~5.4.0',
          },
        },
      },
      {
        name: 'ember-5.8',
        npm: {
          devDependencies: {
            ...ember5Deps,
            'ember-source': '~5.8.0',
          },
        },
      },
      {
        name: 'ember-5.12',
        npm: {
          devDependencies: {
            ...ember5Deps,
            'ember-source': '~5.12.0',
          },
        },
      },
      {
        name: 'ember-release',
        npm: {
          devDependencies: {
            ...ember6Deps,
            'ember-source': await getChannelURL('release'),
          },
        },
      },
      {
        name: 'ember-beta',
        npm: {
          devDependencies: {
            ...ember6Deps,
            'ember-source': await getChannelURL('beta'),
          },
        },
      },
      {
        name: 'ember-canary',
        npm: {
          devDependencies: {
            ...ember6Deps,
            'ember-source': await getChannelURL('canary'),
          },
        },
      },
      embroiderSafe({
        npm: {
          devDependencies: {
            ...ember6Deps,
            'ember-source': await getChannelURL('release'),
          },
        },
      }),
      embroiderOptimized({
        npm: {
          devDependencies: {
            ...ember6Deps,
            'ember-source': await getChannelURL('release'),
          },
        },
      }),
    ],
  };
};
