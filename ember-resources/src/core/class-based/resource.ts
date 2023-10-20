// @ts-ignore
import { getValue } from '@glimmer/tracking/primitives/cache';
import { setOwner } from '@ember/application';
import { assert } from '@ember/debug';
// @ts-ignore
import { invokeHelper } from '@ember/helper';

import { INTERNAL } from '../function-based/types';
import { DEFAULT_THUNK, normalizeThunk } from '../utils';

import type { AsThunk, Cache, Constructor, Named, Positional, Thunk } from '[core-types]';
import type Owner from '@ember/owner';
import type { HelperLike } from '@glint/template';
// this lint thinks this type import is used by decorator metadata...
// babel doesn't use decorator metadata
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { Invoke } from '@glint/template/-private/integration';

/**
 * @private utility type
 *
 * Returns the Thunk-cased args for a given Class/InstanceType of Resource
 */
export type ArgsFrom<Klass extends Resource<any>> = Klass extends Resource<infer Args>
  ? Args
  : never;

/**
 * https://gist.github.com/dfreeman/e4728f2f48737b44efb99fa45e2d22ef#typing-the-return-value-implicitly
 *
 * This is a Glint helper to help HelperLike determine what the ReturnType is.
 */
type ResourceHelperLike<T, R> = InstanceType<
  HelperLike<{
    Args: {
      Named: Named<T>;
      Positional: Positional<T>;
    };
    Return: R;
  }>
>;

declare const __ResourceArgs__: unique symbol;

/**
 * The 'Resource' base class has only one lifecycle hook, `modify`, which is called during
 * instantiation of the resource as well as on every update of any of any consumed args.
 *
 * Typically, a `Resource` will be used to build higher-level APIs that you'd then use in your apps.
 * For example, maybe you want to build a reactive-wrapper around a non-reactive wrapper, XState
 * which requires that the "State machine interpreter"
 * is stopped when you are discarding the parent context (such as a component).
 *
 * _When would you reach for the class-based `Resource` instead of the function-based `resource`?_
 *
 *  - the capabilities of the function-based resource and class-based resource are almost identical.
 *    the main difference is that function-based resources may represent a single a value
 *    (which could, itself, be a class instance, or object with properties),
 *    class-based-resources expose the whole class instance to the consumer.
 *
 *  - function-based resources, however, are much easier to work with and understand, and have
 *    better intellisense capabilities.
 *
 *
 * An example
 * ```js
 * import { Resource } from 'ember-resources';
 * import { createMachine, interpret } from 'xstate';
 *
 * const machine = createMachine(); // ... see XState docs for this function this ...
 *
 * class MyResource extends Resource {
 *   @tracked customState;
 *
 *   constructor(owner) {
 *     super(owner);
 *
 *     registerDestructor(this, () => this.interpreter.stop());
 *   }
 *
 *   modify(positional, named) {
 *     if (!this.interpreter) {
 *       // Initial Setup
 *       this.interpreter = interpret(machine).onTransition(state => this.customState = state);
 *     } else {
 *       // Subsequent Updates
 *       this.interpreter.send('SOME_EVENT', { positional, named });
 *     }
 *   }
 * }
 * ```
 *
 * Once defined, there are two ways to use `MyResource`
 *  - in a template
 *  - in JavaScript
 *
 * In the template, the Resource can be imported (or re-exported from the helpers directory)
 *
 * When imported (using [RFC 779](https://github.com/emberjs/rfcs/pull/779)),
 * ```jsx gjs
 * import { MyResource } from './somewhere';
 *
 * <template>
 *   {{#let (MyResource) as |myResource|}}
 *     {{log myResource.customState}}
 *   {{/let}}
 * </template>
 *
 * ```
 *
 * When using in javascript, you'll need the `from` utility
 * ```ts
 * import { MyResource } from './somewhere';
 *
 * class ContainingClass {
 *   state = MyResource.from(this, () => [...])
 * }
 * ```
 * However, when authoring a Resource, it's useful to co-locate an export of a helper function:
 * ```js
 * export function myResource(destroyable, options) {
 *   return MyResource.from(destroyable, () => ({
 *     foo: () => options.foo,
 *     bar: () => options.bar,
 *   }))
 * }
 * ```
 *
 * This way, consumers only need one import.
 *
 * If your resource may be used with other resources in the same file,
 * class-based resources also work with use, which gives the benefit of
 * omitting the `this` parameter to `from`.
 *
 * ```js
 * import { use } from 'ember-resources';
 * import { MyResource } from './somewhere';
 * import { SomeRequest } from './somewhere-else';
 * import { WebSocket } from './connection';
 *
 * class ContainingClass {
 *   @use state = MyResource.from(() => [...])
 *   @use request = SomeRequest.from(() => [...])
 *   @use socket = WebSocket.from(() => [...])
 * }
 * ```
 *
 */
export class Resource<Args = unknown> {
  /**
   * @private (secret)
   *
   * Because classes are kind of like interfaces,
   * we need "something" to help TS know what a Resource is.
   *
   * This isn't a real API, but does help with type inference
   * with the ArgsFrom utility above
   */
  public declare [__ResourceArgs__]: Args;

  /**
   * @private (secret)
   *
   * This is a lie, but a useful one for Glint, because
   * Glint's "HelperLike" matches on this "Invoke" property.
   *
   * Faking the interface of `HelperLike` is the only way we can get Glint to treat
   *  class-based resources as helpers in templates.
   *
   * If subclassing was not needed, we could just "merge the interface" with Resource
   * and HelperLike, but merged interfaces are not retained in subclasses.
   *
   * Without this, the static method, from, would have a type error.
   */
  declare [Invoke]: ResourceHelperLike<Args, this>[typeof Invoke];

  /**
   * For use in the body of a class.
   *
   * `from` is what allows resources to be used in JS, they hide the reactivity APIs
   * from the consumer so that the surface API is smaller.
   *
   * ```js
   * import { Resource, use } from 'ember-resources';
   *
   * class SomeResource extends Resource {}
   *
   * class MyClass {
   *   @use data = SomeResource.from(() => [ ... ]);
   * }
   * ```
   */
  static from<SomeResource extends Resource<any>>(
    this: Constructor<SomeResource>,
    thunk: AsThunk<ArgsFrom<SomeResource>>,
  ): SomeResource;

  /**
   * For use in the body of a class.
   *
   * `from` is what allows resources to be used in JS, they hide the reactivity APIs
   * from the consumer so that the surface API is smaller.
   * Though it _may_ be more convenient to not wrap your resource abstraction in a helper function.
   *
   * ```js
   * import { Resource } from 'ember-resources';
   *
   * class SomeResource extends Resource {}
   *
   * class MyClass {
   *   data = SomeResource.from(this, () => [ ... ]);
   * }
   * ```
   *
   * However, if you have argument defaults or need to change the shape of arguments
   * depending on what ergonomics you want your users to have, a wrapper function
   * may be better.
   *
   * ```js
   * export function someResource(context, { foo, bar }) {
   *   return SomeResource.from(context, () =>  ... );
   * }
   * ```
   *  usage:
   * ```js
   * import { someResource } from 'your-library';
   *
   * class SomeResource extends Resource {}
   *
   * class MyClass {
   *   @tracked foo;
   *   @tracked bar;
   *
   *   data = someResource(this, {
   *     foo: () => this.foo,
   *     bar: () => this.bar
   *   });
   * }
   * ```
   */
  static from<SomeResource extends Resource<any>>(
    this: Constructor<SomeResource>,
    context: unknown,
    thunk: AsThunk<ArgsFrom<SomeResource>>,
  ): SomeResource;

  static from<SomeResource extends Resource<any>>(
    this: Constructor<SomeResource>,
    contextOrThunk: unknown | AsThunk<ArgsFrom<SomeResource>>,
    thunkOrUndefined?: undefined | AsThunk<ArgsFrom<SomeResource>>,
  ): SomeResource {
    /**
     * This first branch is for
     *
     * ```js
     * class Foo {
     *   @use foo = SomeResource.from(() => [ ... ])
     * }
     * ```
     *
     * and in order to support this, we need to defer the passed
     * thunk until when the decorator is accessed.
     *
     * The decorator mostly does what `resourceOf` is doing below, but
     * a little more simply, because we don't have to deal with a Proxy.
     *
     */
    if (typeof contextOrThunk === 'function') {
      /**
       * We have to lie here because TypeScript doesn't allow decorators
       * to alter the type of a property.
       *
       * This is private API that the `@use` decorator understands,
       * but is not supported for use by any other conusmer.
       */
      return {
        thunk: contextOrThunk,
        definition: this,
        type: 'class-based',
        [INTERNAL]: true,
      } as unknown as SomeResource;
    }

    /**
     * This usage is for decorator-less usage
     *
     * ```js
     * class Foo {
     *   foo = SomeResource.from(this, () => [ ... ])
     * }
     * ```
     *
     * The only tradeoff is that a `this` needs to be passed.
     *
     */
    return resourceOf(contextOrThunk, this, thunkOrUndefined);
  }

  // owner must be | unknown as to not
  // break existing code
  constructor(owner: Owner | unknown) {
    setOwner(this, owner as Owner);
  }

  /**
   * this lifecycle hook is called whenever arguments to the resource change.
   * This can be useful for calling functions, comparing previous values, etc.
   *
   * the two arguments, `positional`, and `named` will always be present, and
   * can be assigned to properties on the class to use derived-from-args patterns.
   * For example,
   * ```js
   * export class MyResource extends Resource {
   *   modify(positional, named) {
   *     this.positional = positional;
   *     this.named = named;
   *   }
   *
   *   get foo() {
   *     return this.named.foo;
   *   }
   * }
   * ```
   * both the `positional` and `named` properties don't need to be tracked, because the
   * objects they are set to are tracked internally -- and between `modify` calls,
   * they are actually the same object. So in this example, after the first time `modify`
   * is called, any subsequent calls to `modify` will be no-ops.
   *
   * This strategy is good for fine-grained reactivity in your resource because it allows
   * your args to be individually consumed as needed. In the above example, accessing `foo`
   * will entangle with the named arg, foo, so when that named arg changes, updates to your UI
   * accessing MyResource's foo getter will also update, accordingly.
   *
   */
  modify?(positional: Positional<Args>, named: Named<Args>): void;
}

function resourceOf<SomeResource extends Resource<unknown>>(
  context: unknown,
  klass: Constructor<SomeResource>,
  thunk?: Thunk,
): SomeResource {
  assert(
    `Expected second argument, klass, to be a Resource. ` +
      `Instead, received some ${typeof klass}, ${klass.name}`,
    klass.prototype instanceof Resource,
  );

  let cache: Cache<SomeResource>;

  /*
   * Having an object that we use invokeHelper + getValue on
   * is how we convert the "native class" in to a reactive utility
   * (along with the following proxy for accessing anything on this 'value')
   *
   */
  let target = {
    get value(): SomeResource {
      if (!cache) {
        cache = invokeHelper(context, klass, () => normalizeThunk(thunk || DEFAULT_THUNK));
      }

      return getValue<SomeResource>(cache);
    },
  };

  /**
   * This proxy takes everything called on or accessed on "target"
   * and forwards it along to target.value (where the actual resource instance is)
   *
   * It's important to only access .value within these proxy-handler methods so that
   * consumers "reactively entangle with" the Resource.
   */
  return new Proxy(target, {
    get(target, key): unknown {
      const instance = target.value as unknown as object;
      const value = Reflect.get(instance, key, instance);

      return typeof value === 'function' ? value.bind(instance) : value;
    },

    ownKeys(target): (string | symbol)[] {
      const instance = target.value as unknown as object;

      return Reflect.ownKeys(instance);
    },

    getOwnPropertyDescriptor(target, key): PropertyDescriptor | undefined {
      const instance = target.value as unknown as object;

      return Reflect.getOwnPropertyDescriptor(instance, key);
    },
  }) as never as SomeResource;
}
