import { helper as emberHelper } from '@ember/component/helper';

import { helper } from 'ember-resources/util/helper';
import { expectType } from 'ts-expect';

expectType<{ value: number }>(
  helper(
    globalThis,
    emberHelper(() => 2)
  )
);

expectType<{ value: string }>(
  helper(
    globalThis,
    emberHelper(() => 'string')
  )
);

expectType<{ value: [number, string] }>(
  helper(
    globalThis,
    emberHelper(([a, b]: [number, string]) => [a, b])
  )
);

expectType<{ value: [number, string] }>(
  helper(
    globalThis,
    emberHelper(([a, b]: [number, string]) => [a, b])
  )
);
