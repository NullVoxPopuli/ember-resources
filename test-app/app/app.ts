import Application from '@ember/application';

import setupDeprecationWorkflow from 'ember-cli-deprecation-workflow';
import loadInitializers from 'ember-load-initializers';
import Resolver from 'ember-resolver';
import config from 'test-app/config/environment';

setupDeprecationWorkflow({
  throwOnUnhandled: true,
  workflow: [],
});

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}

loadInitializers(App, config.modulePrefix);
