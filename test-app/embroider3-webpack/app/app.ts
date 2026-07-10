import Application from '@ember/application';

// CI isn't finding the types for this
// @ts-ignore bah
import setupDeprecationWorkflow from 'ember-cli-deprecation-workflow';
import loadInitializers from 'ember-load-initializers';
import Resolver from 'ember-resolver';
import config from 'test-app/config/environment';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call -- the import above is @ts-ignore'd
setupDeprecationWorkflow({
  throwOnUnhandled: true,
  workflow: [
    // Caused by older '@glimmer/component'
    // (irrelevant for this test suite)
    {
      handler: 'silence',
      matchId: 'deprecate-import--is-destroying-from-ember',
    },
    {
      handler: 'silence',
      matchId: 'deprecate-import--is-destroyed-from-ember',
    },
    {
      handler: 'silence',
      matchId: 'deprecate-import--register-destructor-from-ember',
    },
    {
      handler: 'silence',
      matchId: 'deprecate-import-destroy-from-ember',
    },
  ],
});

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}

loadInitializers(App, config.modulePrefix);
