// typed-ember has not published types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { setOwner } from '@ember/application';
import { associateDestroyableChild, registerDestructor } from '@ember/destroyable';
// typed-ember has not published types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { capabilities as helperCapabilities, setHelperManager } from '@ember/helper';

import type { ArgsWrapper, Cache, LooseArgs, Thunk } from '../types';

export declare interface LifecycleResource<T extends LooseArgs = ArgsWrapper> {
  args: T;
  setup(): void;
  update(): void;
  teardown(): void;
}

/**
 *
 *
 * When possible, you'll want to favor `Resource` over `LifecycleResource` as `Resource` is simpler.
 *
 * They key differences are that the `LifecycleResource` base class has 3 lifecycle hooks
 *  - `setup` - called upon first access of the resource
 *  - `update` - called when any `tracked` used during `setup` changes
 *  - `teardown` - called when the containing context is torn down
 *
 * The main advantage to the `LifecycleResource` is that the teardown hook is for "last teardown",
 * whereas with `Resource`, if a destructor is registered in the destructor, there is no way to know
 * if that destruction is the final destruction.
 *
 *
 * An example of when you'd want to reach for the `LifecycleResource` is when you're managing external long-lived
 * state that needs a final destruction call, such as with XState, which requires that the "State machine interpreter"
 * is stopped when you are discarding the parent context (such as a component).
 *
 * An example
 * ```js
 * import { LifecycleResource } from 'ember-resources';
 * import { createMachine, interpret } from 'xstate';
 *
 * const machine = createMachine(); // ... see XState docs for this function this ...
 *
 * class MyResource extends LifecycleResource {
 *   @tracked state;
 *
 *   setup() {
 *     this.interpreter = interpret(machine).onTransition(state => this.state = state);
 *   }
 *
 *   update() {
 *     this.interpreter.send('ARGS_UPDATED', this.args);
 *   }
 *
 *   teardown() {
 *     this.interpreter.stop();
 *   }
 * }
 * ```
 *
 * Using this Resource is the exact same as `Resource`
 * ```ts
 * import { useResource } from 'ember-resources';
 *
 * class ContainingClass {
 *   state = useResource(this, MyResource, () => [...])
 * }
 * ```
 *
 * There _is_ however a semi-unintuitive technique you could use to continue to use `Resource` for the `final` teardown:
 *
 * ```js
 * import { Resource } from 'ember-resources';
 * import { registerDestructor, unregisterDestructior } from '@ember/destroyable';
 *
 * class MyResource extends Resource {
 *   constructor(owner, args, previous) {
 *     super(owner, args, previous);
 *
 *     registerDestructor(this, this.myFinalCleanup);
 *
 *     if (previous) {
 *       // prevent destruction
 *       unregisterDestructor(prev, prev.myFinalCleanup);
 *     } else {
 *       // setup
 *     }
 *   }
 *
 *   @action myFinalCleanup() {  }
 * }
 * ```
 */
export class LifecycleResource<T extends LooseArgs = ArgsWrapper> {
  static with<Args extends ArgsWrapper, SubClass extends LifecycleResource<Args>>(
    /* hack to get inheritence in static methods */
    this: { new (owner: unknown, args: Args, previous?: SubClass): SubClass },
    thunk: Thunk
  ): SubClass {
    // Lie about the type because `with` must be used with the `@use` decorator
    return [this, thunk] as unknown as SubClass;
  }

  constructor(owner: unknown, public args: T) {
    setOwner(this, owner);
  }
}

class LifecycleResourceManager {
  capabilities = helperCapabilities('3.23', {
    hasValue: true,
    hasDestroyable: true,
  });

  constructor(protected owner: unknown) {}

  createHelper(Class: typeof LifecycleResource, args: ArgsWrapper) {
    let owner = this.owner;

    let instance: LifecycleResource<ArgsWrapper>;

    let cache: Cache = createCache(() => {
      if (instance === undefined) {
        instance = setupInstance(cache, Class, owner, args);
      } else {
        instance.update();
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

function setupInstance(
  cache: Cache,
  Class: typeof LifecycleResource,
  owner: unknown,
  args: ArgsWrapper
) {
  let instance = new Class(owner, args);

  associateDestroyableChild(cache, instance);

  if ('setup' in instance) {
    instance.setup();
  }

  if ('teardown' in instance) {
    registerDestructor(instance, () => instance.teardown());
  }

  return instance;
}

setHelperManager((owner: unknown) => new LifecycleResourceManager(owner), LifecycleResource);
