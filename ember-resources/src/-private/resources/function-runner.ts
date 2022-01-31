/* eslint-disable @typescript-eslint/no-explicit-any */
import { isDestroyed, isDestroying } from '@ember/destroyable';
import { get as consume, notifyPropertyChange as dirty } from '@ember/object';
import { schedule } from '@ember/runloop';
import { waitForPromise } from '@ember/test-waiters';

import { LifecycleResource } from './lifecycle';

import type { ArgsWrapper, Fn } from '../types';

export const FUNCTION_TO_RUN = Symbol('FUNCTION TO RUN');
export const INITIAL_VALUE = Symbol('INITIAL VALUE');
export const FN_SETUP = '__ FN __';
export const SECRET_VALUE = '___ Secret Value ___';

export interface BaseArgs<FnArgs extends unknown[]> extends ArgsWrapper {
  positional: FnArgs;
}

interface TrackedArgs extends ArgsWrapper {
  positional: [Fn, unknown];
}

export class TrackedFunctionRunner extends LifecycleResource<TrackedArgs> {
  // non-tracked so we can read and make changes
  // without engaging in auto-tracking
  private declare [SECRET_VALUE]: unknown | undefined;

  setup() {
    waitForPromise(this.runner());
  }

  update() {
    waitForPromise(this.runner());
  }

  get value() {
    return consume(this, SECRET_VALUE as any) || this.args.positional[1];
  }

  get fn() {
    return this.args.positional[0];
  }

  async runner() {
    if (this.fn === undefined) {
      return;
    }

    let previousValue = this[SECRET_VALUE];
    let value = this.fn(previousValue, ...[]);

    // disconnect from the tracking frame, no matter the type of function
    await Promise.resolve();

    if (isDestroying(this) || isDestroyed(this)) {
      return;
    }

    if (value && typeof value === 'object' && 'then' in value) {
      // value is actually a promise, so we don't want to return
      // an unresolved promise.
      value = await value;

      if (isDestroying(this) || isDestroyed(this)) {
        return;
      }
    }

    this[SECRET_VALUE] = value;
    dirty(this, SECRET_VALUE);
  }
}

interface ThunkFunctionArgs extends ArgsWrapper {
  positional: unknown[];
  named: {
    [FN_SETUP]: {
      fn: Fn;
      initial?: unknown;
    };
  };
}

export class FunctionRunner extends LifecycleResource<ThunkFunctionArgs> {
  // Set when using useResource
  private declare [SECRET_VALUE]: unknown | undefined;

  #hasRun = false;

  constructor(owner: unknown, args: ThunkFunctionArgs) {
    super(owner, args);
  }

  setup() {
    this.#runner();
  }

  update() {
    this.#runner();
  }

  get value(): unknown | undefined {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    consume(this, SECRET_VALUE as any);

    if (!this.#hasRun && this.#initial) {
      return this.#initial;
    }

    return this[SECRET_VALUE];
  }

  get #fn() {
    return this.args.named[FN_SETUP].fn;
  }

  get #funArgs() {
    return this.args.positional;
  }

  get #initial() {
    return this.args.named[FN_SETUP].initial;
  }

  #runner() {
    /**
     * NOTE: All positional args are consumed
     */
    for (let i = 0; i < this.#funArgs.length; i++) {
      this.#funArgs[i];
    }

    const fun = this.#fn;
    const previous = this[SECRET_VALUE];

    const asyncWaiter = async () => {
      // in case the async function tries to consume things on the parent `this`,
      // be sure we start with a fresh frame
      await new Promise((resolve) => schedule('afterRender', resolve));

      if (isDestroying(this) || isDestroyed(this)) {
        return;
      }

      const value = await fun(previous, ...this.#funArgs);

      if (isDestroying(this) || isDestroyed(this)) {
        return;
      }

      this[SECRET_VALUE] = value;
      this.#hasRun = true;
      dirty(this, SECRET_VALUE);
    };

    waitForPromise(asyncWaiter());
  }
}
