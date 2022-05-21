// @ts-ignore
import { getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';
// @ts-ignore
import { invokeHelper } from '@ember/helper';
import { get } from '@ember/object';

import { dependencySatisfies, importSync, macroCondition } from '@embroider/macros';

import { TASK, TaskResource } from './resources/ember-concurrency-task';
import { DEFAULT_THUNK, normalizeThunk } from './utils';

import type { TaskInstance, TaskIsh } from './resources/ember-concurrency-task';
import type { Cache, Constructable } from './types';
import type { deprecate as emberDebugDeprecate } from '@ember/debug';

let deprecate: typeof emberDebugDeprecate;

if (
  macroCondition(
    dependencySatisfies('ember-source', '^3.28') || dependencySatisfies('ember-source', '^4.0.0')
  )
) {
  // @ts-ignore
  deprecate = importSync('@ember/debug').deprecate;
} else {
  // @ts-ignore
  deprecate = (globalThis.Ember || importSync('@ember/debug')).deprecate;
}

/**
 * @deprecated
 * @utility uses [[LifecycleResource]] to make ember-concurrency tasks reactive.
 *
 * -------------------------
 *
 * @note `ember-resources` does not provide or depend on ember-concurrency.
 * If you want to use [[useTask]], you'll need to add ember-concurrency as a dependency
 * in your project.
 *
 * @example
 *  When `this.id` changes, the task will automatically be re-invoked.
 * ```js
 * import { tracked } from '@glimmer/tracking';
 * import { task, timeout } from 'ember-concurrency';
 * import { useTask } from 'ember-resources';
 *
 * class Demo {
 *   @tracked id = 1;
 *
 *   last = useTask(this, this.searchTask, () => [this.id]);
 *
 *   @task
 *   *searchTask(id) {
 *     yield timeout(200);
 *     yield fetch('...');
 *
 *     return 'the-value';
 *   }
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
export function useTask<
  Return = unknown,
  Args extends unknown[] = unknown[],
  LocalTask extends TaskIsh<Args, Return> = TaskIsh<Args, Return>
>(context: object, task: LocalTask, thunk?: () => Args) {
  assert(`Task does not have a perform method. Is it actually a task?`, 'perform' in task);

  deprecate(
    `The useTask is deprecated. Please migrate to task, exported from 'ember-resources/util/ember-concurrency'`,
    false,
    {
      id: 'ember-resources.useTask',
      until: '5.0.0',
      url: 'https://github.com/NullVoxPopuli/ember-resources/blob/main/MIGRATIONS.md#usetask',
      for: 'ember-resources',
      since: {
        available: '4.6',
      },
    }
  );

  let target = buildUnproxiedTaskResource(context, task, (thunk || DEFAULT_THUNK) as () => Args);

  // TS can't figure out what the proxy is doing
  return proxyClass(target as any) as never as TaskInstance<Return>;
}

const TASK_CACHE = new WeakMap<object, any>();

function buildUnproxiedTaskResource<
  ArgsList extends any[],
  Return,
  LocalTask extends TaskIsh<ArgsList, Return> = TaskIsh<ArgsList, Return>
>(context: object, task: LocalTask, thunk: () => ArgsList) {
  type LocalResource = TaskResource<ArgsList, Return, LocalTask>;
  type Klass = Constructable<LocalResource>;

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
        /**
         * In ember-concurrency@v1, the reactivity is whacky, and
         * we have to do extra work to make the overall API for ember-resources
         * the same
         */
        // See: https://github.com/embroider-build/embroider/issues/1111
        // if (macroCondition(dependencySatisfies('ember-concurrency', '^1.0.0'))) {
        // let { get } = importSync('@ember/object') as any;

        // in ember-concurrency@v1, value is not consumable tracked data
        // until the task is resolved, so we need to consume the isRunning
        // property so that value updates
        // eslint-disable-next-line ember/no-get
        get(taskRunner.currentTask, 'isRunning');
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
