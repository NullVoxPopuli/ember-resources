'use strict';

const getChannelURL = require('ember-source-channel-url');
const { embroiderSafe, embroiderOptimized } = require('@embroider/test-setup');

module.exports = async function () {
  return {
    usePnpm: true,
    scenarios: [
      {
        name: 'ember-3.25',
        npm: {
          devDependencies: {
            'ember-source': '~3.25.0',
          },
        },
      },
      {
        name: 'ember-3.26',
        npm: {
          devDependencies: {
            'ember-source': '~3.26.0',
          },
        },
      },
      {
        name: 'ember-3.28',
        npm: {
          devDependencies: {
            'ember-source': '~3.28.0',
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

      {
        name: 'ember-concurrency-v1',
        npm: {
          dependencies: {
            'ember-concurrency': '^1.0.0',
            'ember-concurrency-decorators': '^2.0.0',
          },
          devDependencies: {
            'ember-source': '~3.28.0',
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
