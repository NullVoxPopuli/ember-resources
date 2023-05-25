/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable ember/no-get */

// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';
// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { invokeHelper } from '@ember/helper';
import { get } from '@ember/object';

import { Resource } from '../core/class-based';
import { DEFAULT_THUNK, normalizeThunk } from '../core/utils';

import type { Cache } from '../core/types';

/**
 * @utility uses [[Resource]] to make ember-concurrency tasks reactive.
 *
 * -------------------------
 *
 * @note `ember-resources` does not provide or depend on ember-concurrency.
 * If you want to use [[task]], you'll need to add ember-concurrency as a dependency
 * in your project.
 *
 * @example
 *  When `this.id` changes, the task will automatically be re-invoked.
 * ```js
 * import { tracked } from '@glimmer/tracking';
 * import { restartableTask, timeout } from 'ember-concurrency';
 * import { task as trackedTask } from 'ember-resources/util/ember-concurrency';
 *
 * class Demo {
 *   @tracked id = 1;
 *
 *   searchTask = restartableTask(async () => {
 *     await timeout(200);
 *     await fetch('...');
 *     return 'the-value';
 *   })
 *
 *   last = trackedTask(this, this.searchTask, () => [this.id]);
 * }
 * ```
 * ```hbs
 * Available Properties:
 *  {{this.last.value}}
 *  {{this.last.isFinished}}
 *  {{this.last.isRunning}}
 *  {{this.last.value}}
 * ```
 *  (and all other properties on a [TaskInstance](https://ember-concurrency.com/api/TaskInstance.html))
 *
 *
 */
export function task<
  Return = unknown,
  Args extends unknown[] = unknown[],
  LocalTask extends TaskIsh<Args, Return> = TaskIsh<Args, Return>
>(context: object, task: LocalTask, thunk?: () => Args) {
  assert(`Task does not have a perform method. Is it actually a task?`, 'perform' in task);

  let target = buildUnproxiedTaskResource(context, task, (thunk || DEFAULT_THUNK) as () => Args);

  // TS can't figure out what the proxy is doing
  return proxyClass(target as any) as never as TaskInstance<Return>;
}

export const trackedTask = task;

const TASK_CACHE = new WeakMap<object, any>();

function buildUnproxiedTaskResource<
  ArgsList extends any[],
  Return,
  LocalTask extends TaskIsh<ArgsList, Return> = TaskIsh<ArgsList, Return>
>(context: object, task: LocalTask, thunk: () => ArgsList) {
  type LocalResource = TaskResource<ArgsList, Return, LocalTask>;
  type Klass = new (...args: unknown[]) => LocalResource;

  let resource: Cache<Return>;
  let klass: Klass;
  let existing = TASK_CACHE.get(task);

  if (existing) {
    klass = existing;
  } else {
    klass = class AnonymousTaskRunner extends TaskResource<ArgsList, Return, LocalTask> {
      [TASK] = task;
    } as Klass;

    TASK_CACHE.set(task, klass);
  }

  return {
    get value(): LocalResource {
      if (!resource) {
        resource = invokeHelper(context, klass, () => {
          return normalizeThunk(thunk);
        }) as Cache<Return>;
      }

      return getValue(resource);
    },
  };
}

/**
 * @private
 */
export function proxyClass<
  ArgsList extends any[],
  Return,
  LocalTask extends TaskIsh<ArgsList, Return>,
  Instance extends TaskResource<ArgsList, Return, LocalTask> = TaskResource<
    ArgsList,
    Return,
    LocalTask
  >
>(target: { value: Instance }) {
  /*
   * This proxy defaults to returning the underlying data on
   * the task runner when '.value' is accessed.
   *
   * When working with ember-concurrency tasks, users have the expectation
   * that they'll be able to inspect the status of the tasks, such as
   * `isRunning`, `isFinished`, etc.
   *
   * To support that, we need to proxy to the `currentTask`.
   *
   */
  return new Proxy(target, {
    get(target, key): unknown {
      const taskRunner = target.value;
      const instance = taskRunner.currentTask;

      if (typeof key === 'string') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        get(taskRunner.currentTask, key);
      }

      if (key === 'value') {
        /**
         * getter than falls back to the previous task's value
         */
        return taskRunner.value;
      }

      /**
       * If the key is anything other than value, query on the currentTask
       */
      const value = Reflect.get(instance as object, key, instance);

      return typeof value === 'function' ? value.bind(instance) : value;
    },
    ownKeys(target): (string | symbol)[] {
      return Reflect.ownKeys(target.value);
    },
    getOwnPropertyDescriptor(target, key): PropertyDescriptor | undefined {
      return Reflect.getOwnPropertyDescriptor(target.value, key);
    },
  }) as never as Instance;
}

export type TaskReturnType<T> = T extends TaskIsh<any, infer Return> ? Return : unknown;
export type TaskArgsType<T> = T extends TaskIsh<infer Args, any> ? Args : unknown[];

export interface TaskIsh<Args extends any[], Return> {
  perform: (...args: Args) => TaskInstance<Return>;
  cancelAll: () => void;
}

/**
 * @private
 *
 * Need to define this ourselves, because between
 * ember-concurrency 1, 2, -ts, decorators, etc
 * there are 5+ ways the task type is defined
 *
 * https://github.com/machty/ember-concurrency/blob/f53656876748973cf6638f14aab8a5c0776f5bba/addon/index.d.ts#L280
 */
export interface TaskInstance<Return = unknown> extends Promise<Return> {
  readonly value: Return | null;
  readonly error: unknown;
  readonly isSuccessful: boolean;
  readonly isError: boolean;
  readonly isCanceled: boolean;
  readonly hasStarted: boolean;
  readonly isFinished: boolean;
  readonly isRunning: boolean;
  readonly isDropped: boolean;
  cancel(reason?: string): void | Promise<void>;
}

/**
 * @private
 */
export const TASK = Symbol('TASK');

/**
 * @private
 */
export class TaskResource<
  Args extends any[],
  Return,
  LocalTask extends TaskIsh<Args, Return>
> extends Resource<{
  positional: Args;
}> {
  // Set via useTask
  declare [TASK]: LocalTask;
  // Set during setup/update
  declare currentTask: TaskInstance<Return>;
  declare lastTask: TaskInstance<Return> | undefined;

  get value() {
    if (this.currentTask?.isFinished && !this.currentTask.isCanceled) {
      return this.currentTask.value;
    }

    return this.lastTask?.value;
  }

  modify(positional: Args) {
    if (this.currentTask) {
      this.lastTask = this.currentTask;
    }

    this.currentTask = this[TASK].perform(...positional);
  }

  teardown() {
    this[TASK].cancelAll();
  }
}
