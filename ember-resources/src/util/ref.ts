import { assert } from '@ember/debug';
import { associateDestroyableChild, destroy, registerDestructor } from '@ember/destroyable';

import { resource } from '../core/function-based';

type Fn<Return = unknown> = () => Return;
interface Linkable {
  link: (parent: )
}

class State {
  static create(factory: Fn) {
    const refcount = new State(factory);

    return {
      link(parent) {
        associateDestroyableChild(parent, refcount);

        return refcount;
      },
    };
  }

  #refcount = 0;
  #factory: Fn;
  #instance: null | State = null;

  constructor(factory: Fn) {
    this.#factory = factory;
  }

  clone() {
    if (this.#refcount++ === 0) {
      this.#instance = this.#factory().link(this);
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

  constructor(instance: State, callback: Fn) {
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
export function RefCount(callback: Fn) {
  let state = State.create(callback);

  return resource(({ on }) => {
    on.cleanup(() => destroy(state));

    return () => state;
  });
}
