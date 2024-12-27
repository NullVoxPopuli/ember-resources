'use strict';

const getChannelURL = require('ember-source-channel-url');
const { embroiderSafe, embroiderOptimized } = require('@embroider/test-setup');

module.exports = async function () {
  const ember5Deps = {
    '@ember/string': '^3.1.1',
    'ember-resolver': '^11.0.0',
    'ember-auto-import': '^2.3.0',
    'ember-cli': '^5.1.0',
    'ember-maybe-import-regenerator': null,
    'ember-cli-dependency-checker': null,
  };

  return {
    usePnpm: true,
    scenarios: [
      {
        name: 'ember-3.28',
        npm: {
          devDependencies: {
            // Max ember-cli
            'ember-cli': '~4.12.0',
            'ember-source': '~3.28.0',
          },
        },
      },
      {
        name: 'ember-4.0.0',
        npm: {
          devDependencies: {
            'ember-source': '~4.0.0',
          },
        },
      },
      {
        name: 'ember-4.4',
        npm: {
          devDependencies: {
            'ember-source': '~4.4.0',
          },
        },
      },
      {
        name: 'ember-4.8',
        npm: {
          devDependencies: {
            'ember-source': '~4.8.0',
          },
        },
      },
      {
        name: 'ember-4.12',
        npm: {
          devDependencies: {
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
            'ember-source': '~5.8.0',
          },
        },
      },
      {
        name: 'ember-5.12',
        npm: {
          devDependencies: {
            'ember-source': '~5.12.0',
          },
        },
      },
      {
        name: 'ember-release',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('release'),
          },
        },
      },
      {
        name: 'ember-beta',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('beta'),
          },
        },
      },
      {
        name: 'ember-canary',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('canary'),
          },
        },
      },
      embroiderSafe({
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('release'),
          },
        },
      }),
      embroiderOptimized({
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('release'),
          },
        },
      }),
    ],
  };
};
