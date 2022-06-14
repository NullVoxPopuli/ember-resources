import { tracked } from '@glimmer/tracking';
import { waitForPromise } from '@ember/test-waiters';

import { resource, resourceFactory } from './function-resource';

import type { Hooks } from './function-resource';

type FetchOptions = Parameters<typeof fetch>[1];

/**
 * @protected
 */
export class State {
  /**
   * If an exception was thrown while making the request, the error
   * thrown will be here.
   */
  @tracked error = null;
  /**
   * The resolved value of the fetch request
   */
  @tracked value = null;

  /**
   * HTTP status code.
   */
  @tracked status: null | number = null;

  /**
   * true if the request has finished
   */
  get isResolved() {
    return Boolean(this.value) || Boolean(this.error);
  }

  /**
   * Alias for isLoading
   */
  get isPending() {
    return this.isLoading;
  }

  /**
   * true if the fetch request is in progress
   */
  get isLoading() {
    return !this.isResolved;
  }

  /**
   * true if the request throws an exception
   */
  get isError() {
    return Boolean(this.error);
  }
}

/**
 * Native [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
 * but with built-in [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
 *
 * example with composition (maybe you want to implement your own version
 * that also wraps up authorization headers):
 * ```js
 * import { tracked } from '@glimmer/tracking';
 * import { use, resource } from 'ember-resources/util/function-resource';
 * import { remoteData } from 'ember-resources/util/remote-data';
 *
 * class Demo {
 *   @tracked id = 1;
 *
 *   @use myData = resource((hooks) =>
 *     remoteData(hooks, `https://...${this.id}`)
 *   );
 * }
 * ```
 *
 * The same example, but without `@use`
 *
 * ```js
 * import { tracked } from '@glimmer/tracking';
 * import { resource } from 'ember-resources/util/function-resource';
 * import { remoteData } from 'ember-resources/util/remote-data';
 *
 * class Demo {
 *   @tracked id = 1;
 *
 *   myData = resource(this, (hooks) =>
 *     remoteData(hooks, `https://...${this.id}`)
 *   );
 * }
 * ```
 *
 */
export function remoteData({ on }: Hooks, url: string, options: FetchOptions = {}): State {
  let state = new State();
  let controller = new AbortController();

  on.cleanup(() => controller.abort());

  waitForPromise(
    fetch(url, { signal: controller.signal, ...options })
      .then((response) => {
        state.status = response.status;

        return response.json();
      })
      .then((data) => {
        state.value = data;
      })
      .catch((error) => {
        state.error = error;
      })
  );

  return state;
}

/**
 * json-based remote data utility.
 *
 * this API mimics the API of `fetch`, and will give you a reactive
 * [[State]] object, but won't be able to re-fetch when the url or options
 * change
 *
 * ```js
 * import { tracked } from '@glimmer/tracking';
 * import { use } from 'ember-resources/util/function-resource';
 * import { RemoteData } from 'ember-resources/util/remote-data';
 *
 * class Demo {
 *   @use myData = RemoteData(`https://some.domain.io`);
 *
 *   @use withOptions = RemoteData(`https://some.domain.io`, {
 *     headers: {
 *       Authorization: 'Bearer <token>'
 *     }
 *   });
 * }
 * ```
 *
 * In strict mode with &lt;template&gt;
 * ```jsx gjs
 * import { RemoteData } from 'ember-resources/util/remote-data';
 *
 * const options = (token) => ({
 *   headers: {
 *     Authorization: `Bearer ${token}`
 *   }
 * });
 *
 * <template>
 *  {{#let (RemoteData "https://some.domain" (options "my-token")) as |state|}}
 *    {{state.isLoading}}
 *    {{state.value}}
 *  {{/let}}
 * </template>
 * ```
 *
 */
export function RemoteData(url: string, options?: FetchOptions): State;

/**
 * json-based remote data utility
 *
 *
 * For a reactive URL (causing the underlyng fetch to re-run when the URL changes),
 * the url must be the return value from a function passed to
 * `RemoteData`.
 *
 * ```js
 * import { tracked } from '@glimmer/tracking';
 * import { use } from 'ember-resources/util/function-resource';
 * import { RemoteData } from 'ember-resources/util/remote-data';
 *
 * class Demo {
 *   @tracked url = 'https:// .... '
 *
 *   @use myData = RemoteData(() => this.url);
 * }
 * ```
 */
export function RemoteData(url: () => string): State;

/**
 * json-based remote data utility
 *
 * When you want the remote data request to re-fetch
 * when either the URL or `FetchOptions` change, the `url`
 * becomes a property on the object returned from the thunk.
 *
 * ```js
 * import { tracked } from '@glimmer/tracking';
 * import { use } from 'ember-resources/util/function-resource';
 * import { RemoteData } from 'ember-resources/util/remote-data';
 *
 * class Demo {
 *   @tracked id = 2;
 *   @tracked postData = '';
 *
 *   @use myData = RemoteData(() => ({
 *     url: `https://this.some.domain/${this.id}`,
 *     method: 'POST',
 *     body: this.postData
 *   }));
 * }
 * ```
 */
export function RemoteData(options: () => { url: string } & FetchOptions): State;

/**
 * json-based remote data utility
 */
export function RemoteData(
  url: string | (() => string) | (() => { url: string } & FetchOptions),
  opts?: FetchOptions
) {
  return resource((hooks) => {
    let result = typeof url === 'string' ? url : url();
    let targetUrl: string;
    let options: FetchOptions = {};

    if (typeof result === 'string') {
      targetUrl = result;
    } else {
      let { url, ...opts } = result;

      targetUrl = url;
      options = opts;
    }

    if (opts) {
      options = { ...options, ...opts };
    }

    return remoteData(hooks, targetUrl, options);
  });
}

resourceFactory(RemoteData);
