import { expectTypeOf } from 'expect-type';

import { keepLatest } from '../src/util/keep-latest';

const foo: boolean = true;

const value = keepLatest({
  value: () => foo,
  when: () => true,
});

expectTypeOf(value).toMatchTypeOf<boolean>();
