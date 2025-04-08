import { Reactive } from "./function-based/types.js";
import { Stage1DecoratorDescriptor } from "./types.js";
type NonInstanceType<K> = K extends InstanceType<any> ? object : K;
type DecoratorKey<K> = K extends string | symbol ? K : never;
/**
 * The `@use(...)` decorator can be used to use a Resource in javascript classes
 *
 * ```js
 * import { resource, use } from 'ember-resources';
 *
 * const Clock = resource( ... );
 *
 * class Demo {
 *   @use(Clock) time;
 * }
 * ```
 */
declare function use<Value>(definition: Value | (() => Value)): PropertyDecorator;
/**
 * The `@use` decorator can be used to use a Resource in javascript classes
 *
 * ```js
 * import { resource, use } from 'ember-resources';
 *
 * const Clock = resource(() => 2);
 *
 * class MyClass {
 *   @use data = Clock;
 * }
 *
 * (new MyClass()).data === 2
 * ```
 */
declare function use<Prototype, Key>(prototype: NonInstanceType<Prototype>, key: DecoratorKey<Key>, descriptor?: Stage1DecoratorDescriptor): void;
/**
 * The `use function can be used to use a Resource in javascript classes
 *
 * Note that when using this version of `use`, the value is only accessible on the `current`
 * property.
 *
 * ```js
 * import { resource, use } from 'ember-resources';
 *
 * const Clock = resource( ... );
 *
 * class Demo {
 *   data = use(this, Clock);
 * }
 *
 * (new Demo()).data.current === 2
 * ```
 */
declare function use<Value>(parent: object, definition: Value | (() => Value), _?: never): Reactive<Value extends Reactive<any> ? Value['current'] : Value>;
export { use };
