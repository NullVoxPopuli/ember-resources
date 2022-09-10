import { assert } from '@ember/debug';
import { associateDestroyableChild, destroy, registerDestructor } from '@ember/destroyable';

import { resource } from '../core/function-based';

type Fn<Return = unknown> = () => Return;

class State {
  static create(factory: Fn<object>) {
    const refcount = new State(factory);

    return {
      link(parent: object) {
        associateDestroyableChild(parent, refcount);

        return refcount;
      },
    };
  }

  #refcount = 0;
  #factory: Fn<object>;
  #instance: null | object = null;

  constructor(factory: Fn<object>) {
    this.#factory = factory;
  }

  clone() {
    if (this.#refcount++ === 0) {
      this.#instance = this.#factory();
      associateDestroyableChild(this, this.#instance);
    }

    assert(
      `Could not create internal state instance because state failed to be created.`,
      this.#instance
    );

    return new RefcountInstance(this.#instance, () => {
      if (--this.#refcount === 0) {
        this.#destroy();
      }
    });
  }

  #destroy() {
    if (this.#instance !== null) {
      destroy(this.#instance);
      this.#instance = null;
    }
  }
}

export class RefcountInstance {
  #value;

  constructor(instance: object, callback: Fn) {
    this.#value = instance;

    registerDestructor(this, callback);
  }

  link(parent: object) {
    associateDestroyableChild(parent, this);

    return this.#value;
  }
}

/**
 * A utility Resource that will only destroy itself once
 * all consumers of the Resource have been destroyed.
 *
 * For example, when used on a service, multiple components
 * may access a WebSocket and upon initial access, the WebSocket
 * is setup, but it is not torn down until the last accessor is
 * turn down.
 */
export function RefCount(this: object, callback: Fn<object>) {
  let state = State.create(callback).link(this);

  return resource(({ on }) => {
    let value = state.clone();

    on.cleanup(() => destroy(state));

    return value;
  });
}
