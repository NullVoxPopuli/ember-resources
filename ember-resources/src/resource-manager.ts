import { assert } from '@ember/debug';
// @ts-ignore
import { capabilities as helperCapabilities } from '@ember/helper';

import { compatOwner } from './ember-compat.ts';

import type { Builder, Resource } from './intermediate-representation.ts';
import type Owner from '@ember/owner';

const setOwner = compatOwner.setOwner;

/**
 * Note, a function-resource receives on object, hooks.
 *    We have to build that manually in this helper manager
 */
class FunctionResourceManager<Value> {
  capabilities: ReturnType<typeof helperCapabilities> = helperCapabilities('3.23', {
    hasValue: true,
    hasDestroyable: true,
  });

  constructor(protected owner: Owner) {
    setOwner(this, owner);
  }

  /**
   * Resources do not take args.
   * However, they can access tracked data
   */
  createHelper(builder: Builder<Value>): Resource<Value> {
    let instance = builder.create();

    instance.link(this);

    return instance;
  }

  getValue(state: Resource<Value>) {
    return state.current;
  }

  getDestroyable(state: Resource<Value>) {
    return state.fn;
  }
}

export const ResourceManagerFactory = (owner: Owner | undefined) => {
  assert(`Cannot create resource without an owner`, owner);

  return new FunctionResourceManager(owner);
};
