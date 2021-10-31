/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';
// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { invokeHelper } from '@ember/helper';

import { TASK, TaskResource } from './resources/ember-concurrency-task';
import { DEFAULT_THUNK, normalizeThunk } from './utils';

import type { TaskInstance, TaskIsh } from './resources/ember-concurrency-task';
import type { Cache, Constructable } from './types';

export function useTask<
  Return = unknown,
  Args extends unknown[] = unknown[],
  LocalTask extends TaskIsh<Args, Return> = TaskIsh<Args, Return>
>(context: object, task: LocalTask, thunk?: () => Args) {
  assert(`Task does not have a perform method. Is it actually a task?`, 'perform' in task);

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
  return new Proxy(target, {
    get(target, key): unknown {
      const taskRunner = target.value;

      if (key === 'value') {
        /**
         * getter than fallsback to the previous task's value
         */
        return taskRunner.value;
      }

      const instance = taskRunner.currentTask;

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
