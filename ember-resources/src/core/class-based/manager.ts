// @ts-ignore
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { associateDestroyableChild } from '@ember/destroyable';
// @ts-ignore
import { capabilities as helperCapabilities, setHelperManager } from '@ember/helper';

import { Resource } from './resource';

import type { ArgsWrapper } from '[core-types]';
import type Owner from '@ember/owner';

/**
 *
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
// export interface Resource<T extends ArgsWrapper = ArgsWrapper> extends InstanceType<
//   HelperLike<{
//     Args: {
//       Named: NonNullable<T['named']>;
//       Positional: NonNullable<T['positional']>
//     };
//     // Return: number
//   }>
// > {}

class ResourceManager {
  capabilities = helperCapabilities('3.23', {
    hasValue: true,
    hasDestroyable: true,
  });

  constructor(protected owner: Owner) {}

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

setHelperManager((owner: Owner) => new ResourceManager(owner), Resource);
