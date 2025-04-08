import { Class, Stage1Decorator } from "./core/types.js";
type NonKey<K> = K extends string ? never : K extends symbol ? never : K;
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
declare function link<Instance>(child: Class<Instance>): Stage1Decorator;
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
declare function link<Child, Other>(child: Child, parent: NonKey<Other>): Child;
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
declare function link(...args: Parameters<Stage1Decorator>): void;
export { link };
