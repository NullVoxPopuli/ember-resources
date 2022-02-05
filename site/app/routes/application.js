import Route from '@ember/routing/route';
import { action } from '@ember/object';
import config from 'site/config/environment';

export default class Application extends Route {
  @action
  didTransition() {
    if (
      config.environment !== 'test' &&
      window &&
      typeof window.scrollTo === 'function'
    ) {
      window.scrollTo(0, 0);
    }
  }
}
