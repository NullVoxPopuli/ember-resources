/**
 *
 * NOTE: these examples are explicitly for testing types and may not be
 *       suitable for actual runtime usage
 */
import { expectTypeOf } from 'expect-type';

import { Resource } from '../src/core/class-based/resource';

/**
 * with no arguments specified
 */
class A extends Resource {
  a = 1;
}

// TODO: rename to create when there are no args?
// are there use cases for class-based Resources without args?
// no args seems like it'd be easier as a function-resource.
// Valid, no args present
// A.from();
A.from(() => ({}));
A.from(() => []);

// Invalid, A does not expect args
// @ts-expect-error
A.from(() => ({ positional: [1] }));
//
// Invalid, A does not expect args
// @ts-expect-error
A.from(() => ({ named: { foo: 2 } }));

// valid, empty args are ok
A.from(() => ({ positional: [], named: {} }));

export class UsageA {
  a = A.from(this, () => ({}));
  a1 = A.from(this, () => []);

  // Invalid, A does not expect args
  // @ts-expect-error
  a2 = A.from(this, () => ({ positional: [1] }));

  // Invalid, A does not expect args
  // @ts-expect-error
  a3 = A.from(this, () => ({ named: { foo: 2 } }));

  // valid, empty args are ok
  a4 = A.from(this, () => ({ positional: [], named: {} }));
}

/**
 * with all arguments specified
 */
type BArgs = {
  positional: [num: number, greeting: string];
  named: {
    num: number;
    str: string;
  };
};

export class B extends Resource<BArgs> {
  b = 'b';
}

// Valid, all arguments provided
B.from(() => {
  return {
    positional: [1, 'hi'],
    named: { num: 2, str: 'there' },
  };
});

export class UsageB {
  // everything missing
  // @ts-expect-error
  b = B.from(this, () => ({}));

  // named is missing
  // @ts-expect-error
  b1 = B.from(this, () => ({ positional: [1, 'hi'] }));

  // positional is missing
  // @ts-expect-error
  b2 = B.from(this, () => ({ named: { num: 2, str: 'there' } }));

  // positional is incorrect
  // @ts-expect-error
  b3 = B.from(this, () => ({ positional: ['hi'] }));

  // named is incorrect
  // @ts-expect-error
  b4 = B.from(this, () => ({ named: { str: 'there' } }));

  // valid -- all args present
  b5 = B.from(this, () => ({ positional: [1, 'hi'], named: { num: 2, str: 'there' } }));
}

/**
 * with all arguments, but capitalized (Signature style)
 */

type CArgs = {
  Positional: [number, string];
  Named: {
    num: number;
    str: string;
  };
};

export class C extends Resource<CArgs> {
  c = 'c';
}

/**
 * The return value of the thunk has the correct type
 */
export class UsageC {
  // decorator not needed for the type test (I don't want to import it)
  /* @use */ cUse = C.from(() => ({ positional: [1, 'two'], named: { num: 3, str: 'four' } }));
  cThis = C.from(this, () => ({ positional: [1, 'two'], named: { num: 3, str: 'four' } }));
}

expectTypeOf(new UsageC().cUse).toEqualTypeOf<C>();
expectTypeOf(new UsageC().cThis).toEqualTypeOf<C>();
