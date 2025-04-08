import { deprecate } from '@ember/debug';
import { resourceFactory } from '../core/function-based/immediate-invocation.js';
import { resource } from '../core/function-based/resource.js';

deprecate(`importing from 'ember-resources/util/keep-latest' is deprecated and will be removed in ember-resources@v7. ` + `The exact same code and support is available at https://github.com/universal-ember/reactiveweb. ` + `\`pnpm add reactiveweb\` and then \` import { keepLatest } from 'reactiveweb/keep-latest';\`. ` + `See also: https://github.com/NullVoxPopuli/ember-resources/issues/1061`, false, {
  id: `ember-resources.util.keepLatest`,
  until: `7.0.0`,
  for: `ember-resources`,
  url: `https://reactive.nullvoxpopuli.com/functions/keep_latest.keepLatest.html`,
  since: {
    available: '6.4.4',
    enabled: '6.4.4'
  }
});
const isEmpty = x => {
  if (Array.isArray(x)) {
    return x.length === 0;
  }
  if (typeof x === 'object') {
    if (x === null) return true;
    return Object.keys(x).length === 0;
  }
  return x !== 0 && !x;
};
/**
 * <div class="callout note">
 *
 * This is not a core part of ember-resources, but is an example utility to demonstrate a concept when authoring your own resources. However, this utility is still under the broader library's SemVer policy.
 *
 * A consuming app will not pay for the bytes of this utility unless imported.
 *
 * </div>
 *
 * A utility decorator for smoothing out changes in upstream data between
 * refreshes / reload.
 *
 * @example
 * when using RemoteData (or some other promise-based "eventually a value" resource),
 * the value returned from the API is what's useful to see to users. But if the URL
 * changes, the remote request will start anew, and isLoading becomes true, and the value is falsey until the request finishes. This can result in some flicker
 * until the new request finishes.
 *
 * To smooth that out, we can use [[keepLatest]]
 *
 * ```js
 *  import { RemoteData } from 'ember-resources/util/remote-data';
 *  import { keepLatest } from 'ember-resources/util/keep-latest';
 *
 *  class A {
 *    @use request = RemoteData(() => 'some url');
 *    @use data = keepLatest({
 *      value: () => this.request.value,
 *      when: () => this.request.isLoading,
 *    });
 *
 *    get result() {
 *      // after the initial request, this is always resolved
 *      return this.data;
 *    }
 *  }
 * ```
 */
function keepLatest({
  when,
  value: valueFn
}) {
  return resource(() => {
    let previous;
    let initial = true;
    return () => {
      let value = valueFn();
      if (when()) {
        /**
        * Initially, if we may as well return the value instead
        * of the "previous" value is there is no previous yet.
        *
        * We check against undefined, because that's what
        `previous` is "initialized" to.
         *
        And then we never enter this block again, because
        * we will have previous values in future invocations of this
         * Formula.
        */
        if (previous === undefined && initial) {
          initial = false;
          return value;
        }
        return previous = isEmpty(value) ? previous : value;
      }
      return previous = value;
    };
  });
}
resourceFactory(keepLatest);

export { keepLatest };
//# sourceMappingURL=keep-latest.js.map
