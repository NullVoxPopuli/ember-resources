// @ts-ignore
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { setOwner } from '@ember/application';
import { assert } from '@ember/debug';
import { associateDestroyableChild } from '@ember/destroyable';
// @ts-ignore
import { capabilities as helperCapabilities, invokeHelper, setHelperManager } from '@ember/helper';

import { DEFAULT_THUNK, normalizeThunk } from './utils';

import type { ArgsWrapper, Cache, Thunk } from './types';

/**
 * The 'Resource' base class has only one lifecycle hook, `modify`, which is called during
 * instantiation of the resource as well as on every update of any of any consumed args.
 *
 * Typically, a `Resource` will be used to build higher-level APIs that you'd then use in your apps.
 * For example, maybe you want to build a reactive-wrapper around a non-reactive wrapper, XState
 * which requires that the "State machine interpreter"
 * is stopped when you are discarding the parent context (such as a component).
 *
 * An example
 * ```js
 * import { Resource } from 'ember-resources/core';
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
 *       Subsequent Updates
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
 */
export class Resource<T extends ArgsWrapper = ArgsWrapper> {
  /**
   * For use in the body of a class.
   *
   * @note prefer [[from]]
   *
   * `of` is what allows resources to be used in JS, they hide the reactivity APIs
   * from the consumer so that the surface API is smaller. Though, from an end-user-api
   * ergonomics perspective, you wouldn't typically want to rely on this. As in
   * [ember-data-resources](https://github.com/NullVoxPopuli/ember-data-resources/)
   *
   * Given this potential use:
   * ```ts
   * import { Resource } from 'ember-resources';
   *
   * class SomeResource extends Resource {}
   *
   * class MyClass {
   *   data = Resource.of(this, SomeResource, () => [arg list]);
   * }
   * ```
   *
   * a better user-facing api, may be provided by:
   * ```js
   * export function someResource(context, args) {
   *   return Resource.of(context, SomeResource, () =>  ... );
   * }
   * ```
   *  usage:
   * ```js
   * import { someResource } from 'your-library';
   *
   * class SomeResource extends Resource {}
   *
   * class MyClass {
   *   data = someResource(this, () => [arg list]);
   * }
   * ```
   *
   * When any tracked data in the args thunk is updated, the Resource will be updated as well
   *
   *  - The `this` is to keep track of destruction -- so when `MyClass` is destroyed, all the resources attached to it can also be destroyed.
   *  - The resource will **do nothing** until it is accessed. Meaning, if you have a template that guards
   *    access to the data, like:
   *    ```hbs
   *    {{#if this.isModalShowing}}
   *       <Modal>{{this.data.someProperty}}</Modal>
   *    {{/if}}
   *    ```
   *    the Resource will not be instantiated until `isModalShowing` is true.
   */
  static of = resourceOf;

  /**
   * For use in the body of a class.
   *
   * `from` is what allows resources to be used in JS, they hide the reactivity APIs
   * from the consumer so that the surface API is smaller.
   * Unlike `of`, due to the fewer arguments required in `from`, though it _may_ be more
   * convenient to not wrap your resource abstraction in a helper function.
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
  static from<Instance extends Resource<ArgsWrapper>>(
    this: (new (...args: unknown[]) => Instance) & {
      of: typeof resourceOf;
    },
    context: object,
    thunk?: Thunk | (() => unknown)
  ) {
    return this.of(context, this, thunk);
  }

  constructor(owner: unknown) {
    setOwner(this, owner);
  }

  modify?(positional: T['positional'], named: T['named']): void;
}

class ResourceManager {
  capabilities = helperCapabilities('3.23', {
    hasValue: true,
    hasDestroyable: true,
  });

  constructor(protected owner: unknown) {}

  createHelper(Class: typeof Resource, args: ArgsWrapper) {
    let owner = this.owner;

    let instance: Resource<ArgsWrapper>;

    let cache: Cache = createCache(() => {
      if (instance === undefined) {
        instance = new Class(owner);

        associateDestroyableChild(cache, instance);
      }

      if (instance.modify) {
        instance.modify(args.positional, args.named);
      }

      return instance;
    });

    return cache;
  }

  getValue(cache: Cache) {
    let instance = getValue(cache);

    return instance;
  }

  getDestroyable(cache: Cache) {
    return cache;
  }
}

setHelperManager((owner: unknown) => new ResourceManager(owner), Resource);

function resourceOf<Instance extends Resource<ArgsWrapper>, Args extends unknown[] = unknown[]>(
  context: object,
  klass: new (...args: unknown[]) => Instance,
  thunk?: Thunk | (() => Args)
): Instance {
  assert(
    `Expected second argument, klass, to be a Resource. ` +
      `Instead, received some ${typeof klass}, ${klass.name}`,
    klass.prototype instanceof Resource
  );

  let cache: Cache<Instance>;

  /*
   * Having an object that we use invokeHelper + getValue on
   * is how we convert the "native class" in to a reactive utility
   * (along with the following proxy for accessing anything on this 'value')
   *
   */
  let target = {
    get value(): Instance {
      if (!cache) {
        cache = invokeHelper(context, klass, () => normalizeThunk(thunk || DEFAULT_THUNK));
      }

      return getValue<Instance>(cache);
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
  }) as never as Instance;
}

// NOTE: check this with TS 4.7
// https://github.com/microsoft/TypeScript/pull/47607
// https://www.typescriptlang.org/play?ts=4.7.0-dev.20220330#code/FAMwrgdgxgLglgewgAgCYICoAs4QOYA8AogDTICyAfABSoCGMdAXMkQNoC6ZAtnQA4taDMNxZEAlMgC8lCpIDewZMgBOAUxhgVKdQGcEWqGoDyIahhV0oAazWoAgissBPcv2Jkq4gNzAAvkrAwAA2GsgwarowLBZWtg5OdK7uECIARmoqZFEquHiyUmiYOPjUbACMZABMXMhCmtySMsgABgAk8vQNfi0+QVBI+qEAdMEIeNQRUX3AAPTzC4tLyyuzQWoAHnwIKjDI4NDwSKqRBipGpgSOeLrImxEQqLeQ1hAIAO4QnGQAkhBRdGgahoSmQ1mCdF0uhYEDU7zqw0RdBUNxY110TVkfwBQOA4hY2MYQOQ8mQoPUmm0yFh8PBkN01ERwzKHGQkOQLzenzZt3R4j6fl86y2Oz2uAiKhAVjUyAAwoMYCowLA6GlQgQMNIORBXh8ILJFMoaQikSjodrdZ9OPjkBhfAFNttdshxZkpUZkAAZBAIXRqdEk0HbXRwI4QOjBAD8LE5es4viNdG4dmjyAASmoBipUAQcnkyIDnJR7UFgI7RWhMxD1C6IBL3TKM-pDGoNXcNg8nl6fX70QbQdwEKg4CBnNRg6HEOHgjE2AByCdhiNz2rh5OoWdztd2Fc2gBuCDgqBL5edUAhUPTpxbbcK3t9-rN-eUA3+iuVMB21D1mRjOq5EBkHwYBqnAUBsmaMQKKCAQBGWIpnhetyxDYdiOC4bh8MQoTJnWWqxp8nj8HwdgYAg+H-nqsj3Gojy3E2ZxGAQhrIIuU4RmIOG0TA8agtuG4ksgvACHUahcXWnFqLhMCYhQxGkeRgr+M+yAAMTCVqxqYdQArAEAA
