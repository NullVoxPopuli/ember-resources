import { _ as _applyDecoratedDescriptor, a as _initializerDefineProperty } from '../classPrivateFieldGet-PbDBJaSN.js';
import { tracked } from '@glimmer/tracking';
import { deprecate } from '@ember/debug';
import { waitForPromise } from '@ember/test-waiters';
import { resourceFactory } from '../core/function-based/immediate-invocation.js';
import { resource } from '../core/function-based/resource.js';

var _class, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5;
deprecate(`importing from 'ember-resources/util/remote-data' is deprecated and will be removed in ember-resources@v7. ` + `The exact same code and support is available at https://github.com/universal-ember/reactiveweb. ` + `\`pnpm add reactiveweb\` and then \` import { RemoteData } from 'reactiveweb/remote-data';\`. ` + `See also: https://github.com/NullVoxPopuli/ember-resources/issues/1061`, false, {
  id: `ember-resources.util.remoteData`,
  until: `7.0.0`,
  for: `ember-resources`,
  url: `https://reactive.nullvoxpopuli.com/functions/remote_data.remoteData-1.html`,
  since: {
    available: '6.4.4',
    enabled: '6.4.4'
  }
});

/**
 * @protected
 */
let State = (_class = class State {
  constructor() {
    /**
     * If an exception was thrown while making the request, the error
     * thrown will be here.
     */
    _initializerDefineProperty(this, "error", _descriptor, this);
    /**
     * The resolved value of the fetch request
     */
    _initializerDefineProperty(this, "value", _descriptor2, this);
    /**
     * HTTP status code.
     */
    _initializerDefineProperty(this, "status", _descriptor3, this);
    /**
     * True if the request has succeeded
     */
    _initializerDefineProperty(this, "isResolved", _descriptor4, this);
    /**
     * True if the request has failed
     */
    _initializerDefineProperty(this, "isRejected", _descriptor5, this);
  }
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
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, "error", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return null;
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, "value", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return null;
  }
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, "status", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return null;
  }
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, "isResolved", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return false;
  }
}), _descriptor5 = _applyDecoratedDescriptor(_class.prototype, "isRejected", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function () {
    return false;
  }
})), _class);

/**
 * <div class="callout note">
 *
 * This is not a core part of ember-resources, but is an example utility to demonstrate a concept when authoring your own resources. However, this utility is still under the broader library's SemVer policy.
 *
 * A consuming app will not pay for the bytes of this utility unless imported.
 *
 * </div>
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
function remoteData({
  on
}, url, options = {}) {
  let state = new State();
  let controller = new AbortController();
  on.cleanup(() => controller.abort());
  waitForPromise(fetch(url, {
    signal: controller.signal,
    ...options
  }).then(response => {
    state.status = response.status;
    if (response.headers.get('Content-Type')?.includes('json')) {
      return response.json();
    }
    return response.text();
  }).then(data => {
    state.isResolved = true;
    state.value = data;
  }).catch(error => {
    state.isRejected = true;
    state.error = error;
  }));
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

/**
 * json-based remote data utility
 *
 *
 * For a reactive URL (causing the underlying fetch to re-run when the URL changes),
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

/**
 * json-based remote data utility
 */
function RemoteData(url, opts) {
  return resource(hooks => {
    let result = typeof url === 'string' ? url : url();
    let targetUrl;
    let options = {};
    if (typeof result === 'string') {
      targetUrl = result;
    } else {
      let {
        url,
        ...opts
      } = result;
      targetUrl = url;
      options = opts;
    }
    if (opts) {
      options = {
        ...options,
        ...opts
      };
    }
    return remoteData(hooks, targetUrl, options);
  });
}
resourceFactory(RemoteData);

export { RemoteData, State, remoteData };
//# sourceMappingURL=remote-data.js.map
