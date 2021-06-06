// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { setOwner } from '@ember/application';
import { associateDestroyableChild, registerDestructor } from '@ember/destroyable';
// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { capabilities as helperCapabilities, setHelperManager } from '@ember/helper';

import type { ArgsWrapper, Cache } from '../types';

export declare interface LifecycleResource<T extends ArgsWrapper> {
  args: T;
  setup(): void;
  update(): void;
  teardown(): void;
}

export class LifecycleResource<T extends ArgsWrapper> {
  constructor(owner: unknown, args: T) {
    setOwner(this, owner);
    this.args = args;
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
  instance.setup();

  if ('teardown' in instance) {
    registerDestructor(instance, () => instance.teardown());
  }

  return instance;
}

setHelperManager((owner: unknown) => new LifecycleResourceManager(owner), LifecycleResource);
