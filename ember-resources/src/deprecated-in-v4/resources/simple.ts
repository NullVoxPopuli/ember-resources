// typed-ember has not published types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { getOwner, setOwner } from '@ember/application';
import { associateDestroyableChild, destroy } from '@ember/destroyable';
// typed-ember has not published types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { capabilities as helperCapabilities, setHelperManager } from '@ember/helper';

import type { ArgsWrapper, Cache, LooseArgs, Thunk } from '../types';

export declare interface Resource<T extends LooseArgs = ArgsWrapper> {
  args: T;
}

/**
 * @deprecated
 */
export class Resource<T extends LooseArgs = ArgsWrapper> {
  static next<Args extends ArgsWrapper, R extends Resource<Args>>(prev: R, args: Args) {
    // TS does not infer subclass static types
    return new this(getOwner(prev), args, prev) as R;
  }

  static with<Args extends ArgsWrapper, SubClass extends Resource<Args>>(
    /* hack to get inheritence in static methods */
    this: { new (owner: unknown, args: Args, previous?: SubClass): SubClass },
    thunk: Thunk
  ): SubClass {
    // Lie about the type because `with` must be used with the `@use` decorator
    return [this, thunk] as unknown as SubClass;
  }

  /**
   * @param {unknown} [owner] the application owner which allows service injections
   * @param {T} [args] both positional (array) and named (object) args
   * @param {Resource<T>} [previous] if the resource is being updated, this value will be the previous instance of the resource
   *
   */
  constructor(
    owner: unknown,
    public args: T,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    previous?: Resource<T>
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {
    setOwner(this, owner);
  }
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
      let newInstance = new Class(owner, args, instance);

      associateDestroyableChild(cache, newInstance);

      if (instance) destroy(instance);

      instance = newInstance;

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
