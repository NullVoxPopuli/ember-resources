import { getOwner, setOwner } from '@ember/application';
import { assert } from '@ember/debug';
import { associateDestroyableChild, destroy } from '@ember/destroyable';

import { Resource } from '../core';
import { INTERNAL, resource } from './function-resource';

import type ApplicationInstance from '@ember/application/instance';
import { isResourceClass } from 'core/type-guards';

const CACHE = new WeakMap<ApplicationInstance, ServiceRegistry>();

type Definition = object;
type Instance = unknown;

interface Descriptor {
  initializer?: () => unknown;
  configurable?: boolean;
  enumerable?: boolean;
  writable?: boolean;
}

export function service(definition: unknown): PropertyDecorator {
  const decorator = (_: unknown, _key: string | symbol, descriptor: Descriptor) => {
    assert(`@service properties may not be initialized`, !descriptor.initializer);
    assert(
      `@service definition must be an object or function`,
      typeof definition === 'object' || typeof definition === 'function'
    );
    assert(`@service definition may not be falsey`, definition);

    return {
      get() {
        let owner = getOwner(this);
        let name = 'name' in definition ? definition.name : '<unknown definition>';

        assert(
          `Hosting object for @service(${name}) does not have an owner. ` +
            `Please set the owner via setOwner (from '@ember/application')`,
          owner
        );

        let registry = ensureRegistry(
          owner as ApplicationInstance /* owner hasn't had a public type */
        );
        let singleton = registry.get(definition);

        return singleton;
      },
    };
  }

  /* lie to TS .... for... reasons */
  return decorator as unknown as PropertyDecorator;
}

interface ServiceManager<Instance = unknown, Definition = Instance> {
  match: (definition: Definition) => boolean
  create: (definition: Definition) => Instance;

}

class ResourceServiceManager implements ServiceManager {
  match(definition: unknown) {
    if (typeof definition === 'object') {
      if (definition === null) return false;

      let isBasic = INTERNAL in definition

      if (isBasic) {
        return true;
      }


    }

    return isResourceClass(definition);
  }
}


class ServiceRegistry {
  map = new WeakMap<Definition, Instance>();

  register = (definition: Definition) => {
    // TODO: lookup manager
    // TODO: call manager.create

    assert(`Cannot re-register the same service`, !this.map.has(definition));

    this.map.set(
      definition,
      resource(this, ({ on }): any => {
        // assert(`Definition is not instantiatable`, typeof definition === 'function' && 'constructor' in definition);
        // @ts-ignore
        let serviceInstance = new definition();

        on.cleanup(() => destroy(serviceInstance));

        return serviceInstance;
      })
    );
  };

  get = (definition: Definition) => {
    if (!this.map.has(definition)) {
      this.register(definition);
    }

    return this.map.get(definition);
  };
}

function ensureRegistry(owner: ApplicationInstance) {
  let cache = CACHE.get(owner);

  if (!cache) {
    cache = new ServiceRegistry();

    setOwner(cache, owner);
    associateDestroyableChild(owner, cache);

    CACHE.set(owner, cache);
  }

  return cache;
}
