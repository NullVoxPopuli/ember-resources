/* eslint-disable @typescript-eslint/ban-types */
// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getValue } from '@glimmer/tracking/primitives/cache.js';
// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { invokeHelper } from '@ember/helper';

import { DEFAULT_THUNK, normalizeThunk } from './utils';

import type { Cache, Thunk } from './types';
import type { helper as emberFunctionHelper } from '@ember/component/helper';
import type Helper from '@ember/component/helper';

export function useHelper(
  context: object,
  helper: Helper | ReturnType<typeof emberFunctionHelper>,
  thunk: Thunk = DEFAULT_THUNK
) {
  let resource: Cache<unknown>;

  return {
    get value(): unknown {
      if (!resource) {
        resource = invokeHelper(context, helper, () => {
          return normalizeThunk(thunk);
        }) as Cache<unknown>;
      }

      return getValue<unknown>(resource)!; // eslint-disable-line
    },
  };
}
