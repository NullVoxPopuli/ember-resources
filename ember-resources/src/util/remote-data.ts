import { tracked } from '@glimmer/tracking';
import { waitForPromise } from '@ember/test-waiters';

import { resource, resourceFactory } from '../core/function-based';

import type { Hooks } from '../core/function-based';

type FetchOptions = Parameters<typeof fetch>[1];

/**
 * @protected
 */
export class State<T = unknown> {
  /**
   * If an exception was thrown while making the request, the error
   * thrown will be here.
   */
  @tracked error: Error | null = null;
  /**
   * The resolved value of the fetch request
   */
  @tracked value: T | null = null;

  /**
   * HTTP status code.
   */
  @tracked status: null | number = null;

  /**
   * True if the request has succeeded
   */
  @tracked isResolved = false;

  /**
   * True if the request has failed
   */
  @tracked isRejected = false;

  /**
   * true if the request has finished
   */
  get isFinished() {
    return this.isResolved || this.isRejected;
  }

  /**
   * Alias for `isFinished`
   * which is in turn an alias for `isResolved || isRejected`
   */
  get isSettled() {
    return this.isFinished;
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
    return !this.isFinished;
  }

  /**
   * true if the request throws an exception
   * or if the request.status is >= 400
   */
  get isError() {
    let httpError = this.status && this.status >= 400;
    let promiseThrew = this.isRejected;

    return httpError || promiseThrew;
  }
}

/**
 * @note This is not a core part of ember-resources, but is an example utility to demonstrate a concept when authoring your own resources. However, this utility is still under the broader library's SemVer policy.
 * A consuming app will not pay for the bytes of this utility unless imported.
 *
 * Native [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
 * but with built-in [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
 *
 * example with composition (maybe you want to implement your own version
 * that also wraps up authorization headers):
 * ```js
 * import { tracked } from '@glimmer/tracking';
 * import { use, resource } from 'ember-resources';
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
 * import { resource } from 'ember-resources';
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
export function remoteData<T = unknown>(
  { on }: Hooks,
  url: string,
  options: FetchOptions = {}
): State<T> {
  let state = new State<T>();
  let controller = new AbortController();

  on.cleanup(() => controller.abort());

  waitForPromise(
    fetch(url, { signal: controller.signal, ...options })
      .then((response) => {
        state.status = response.status;

        if (response.headers.get('Content-Type')?.includes('json')) {
          return response.json();
        }

        return response.text();
      })
      .then((data) => {
        state.isResolved = true;
        state.value = data;
      })
      .catch((error) => {
        state.isRejected = true;
        state.error = error;
      })
  );

  return state;
}

/**
 * @note This is not a core part of ember-resources, but is an example utility to demonstrate a concept when authoring your own resources. However, this utility is still under the broader library's SemVer policy.
 * A consuming app will not pay for the bytes of this utility unless imported.
 *
 *
 *
 * json-based remote data utility.
 *
 * this API mimics the API of `fetch`, and will give you a reactive
 * [[State]] object, but won't be able to re-fetch when the url or options
 * change
 *
 * ```js
 * import { tracked } from '@glimmer/tracking';
 * import { use } from 'ember-resources';
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
export function RemoteData<T = unknown>(url: string, options?: FetchOptions): State<T>;

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
 * import { use } from 'ember-resources';
 * import { RemoteData } from 'ember-resources/util/remote-data';
 *
 * class Demo {
 *   @tracked url = 'https:// .... '
 *
 *   @use myData = RemoteData(() => this.url);
 * }
 * ```
 */
export function RemoteData<T = unknown>(url: () => string): State<T>;

/**
 * json-based remote data utility
 *
 * When you want the remote data request to re-fetch
 * when either the URL or `FetchOptions` change, the `url`
 * becomes a property on the object returned from the thunk.
 *
 * ```js
 * import { tracked } from '@glimmer/tracking';
 * import { use } from 'ember-resources';
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
export function RemoteData<T = unknown>(options: () => { url: string } & FetchOptions): State<T>;

/**
 * json-based remote data utility
 */
export function RemoteData<T = unknown>(
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

    return remoteData<T>(hooks, targetUrl, options);
  });
}

resourceFactory(RemoteData);
