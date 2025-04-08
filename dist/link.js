import { getOwner, setOwner } from '@ember/application';
import { deprecate, assert } from '@ember/debug';
import { associateDestroyableChild } from '@ember/destroyable';

deprecate(`importing from 'ember-resources/link' is deprecated and will be removed in ember-resources@v7. ` + `The exact same code and support is available at https://github.com/universal-ember/reactiveweb. ` + `\`pnpm add reactiveweb\` and then \` import { link } from 'reactiveweb/link';\`. ` + `See also: https://github.com/NullVoxPopuli/ember-resources/issues/1061`, false, {
  id: `ember-resources.link`,
  until: `7.0.0`,
  for: `ember-resources`,
  url: `https://reactive.nullvoxpopuli.com/functions/link.link.html`,
  since: {
    available: '6.4.4',
    enabled: '6.4.4'
  }
});

/**
 * <div class="callout note">
 *
 * This is not a core part of ember-resources, but is a useful utility when working with Resources. This utility is still under the broader library's SemVer policy.
 *
 * A consuming app will not pay for the bytes of this utility unless imported.
 *
 * </div>
 *
 * A util to abstract away the boilerplate of linking of "things" with an owner
 * and making them destroyable.
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { link } from 'ember-resources/link';
 *
 * class MyClass {  ... }
 *
 * export default class Demo extends Component {
 *   @link(MyClass) myInstance;
 * }
 * ```
 */

/**
 * @note This is not a core part of ember-resources, but is a useful utility when working with Resources. This utility is still under the broader library's SemVer policy.
 * A consuming app will not pay for the bytes of this utility unless imported.
 *
 * A util to abstract away the boilerplate of linking of "things" with an owner
 * and making them destroyable.
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { cached } from '@glimmer/tracking';
 * import { link } from 'ember-resources/link';
 *
 * export default class Demo extends Component {
 *   @cached
 *   get myFunction() {
 *     let instance = new MyClass(this.args.foo);
 *
 *     return link(instance, this);
 *   }
 * }
 * ```
 *
 * NOTE: If args change, as in this example, memory pressure will increase,
 *       as the linked instance will be held on to until the host object is destroyed.
 */

/**
 * @note This is not a core part of ember-resources, but is a useful utility when working with Resources. This utility is still under the broader library's SemVer policy.
 * A consuming app will not pay for the bytes of this utility unless imported.
 *
 * A util to abstract away the boilerplate of linking of "things" with an owner
 * and making them destroyable.
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { link } from 'ember-resources/link';
 *
 * class MyClass {  ... }
 *
 * export default class Demo extends Component {
 *   @link myInstance = new MyClass();
 * }
 * ```
 *
 * NOTE: reactive args may not be passed to `MyClass` directly if you wish updates to be observed.
 *   A way to use reactive args is this:
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { tracked } from '@glimmer/tracking';
 * import { link } from 'ember-resources/link';
 *
 * class MyClass {  ... }
 *
 * export default class Demo extends Component {
 *   @tracked foo = 'bar';
 *
 *   @link myInstance = new MyClass({
 *      foo: () => this.args.foo,
 *      bar: () => this.bar,
 *   });
 * }
 * ```
 *
 * This way, whenever foo() or bar() is invoked within `MyClass`,
 * only the thing that does that invocation will become entangled with the tracked data
 * referenced within those functions.
 */

function link(...args) {
  if (args.length === 3) {
    /**
     * Uses initializer to get the child
     */
    return linkDecorator(...args);
  }
  if (args.length === 1) {
    return linkDecoratorFactory(...args);
  }

  // Because TS types assume property decorators might not have a descriptor,
  // we have to cast....
  return directLink(...args);
}
function directLink(child, parent) {
  associateDestroyableChild(parent, child);
  let owner = getOwner(parent);
  if (owner) {
    setOwner(child, owner);
  }
  return child;
}
function linkDecoratorFactory(child) {
  return function decoratorPrep(...args) {
    return linkDecorator(...args, child);
  };
}
function linkDecorator(_prototype, key, descriptor, explicitChild) {
  assert(`@link is a stage 1 decorator, and requires a descriptor`, descriptor);
  assert(`@link can only be used with string-keys`, typeof key === 'string');
  let {
    initializer
  } = descriptor;
  assert(`@link requires an initializer or be used as a decorator factory (\`@link(...))\`). For example, ` + `\`@link foo = new MyClass();\` or \`@link(MyClass) foo;\``, initializer || explicitChild);
  let caches = new WeakMap();
  return {
    get() {
      let child = caches.get(this);
      if (!child) {
        if (initializer) {
          child = initializer.call(this);
        }
        if (explicitChild) {
          // How do you narrow this to a constructor?
          child = new explicitChild();
        }
        assert(`Failed to create child instance.`, child);
        associateDestroyableChild(this, child);
        let owner = getOwner(this);
        assert(`Owner was not present on parent. Is instance of ${this.constructor.name}`, owner);
        setOwner(child, owner);
        caches.set(this, child);
        assert(`Failed to create cache for internal resource configuration object`, child);
      }
      return child;
    }
  } /* Thanks TS. */;
}

export { link };
//# sourceMappingURL=link.js.map
