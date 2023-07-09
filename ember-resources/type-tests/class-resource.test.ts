import { expectTypeOf } from 'expect-type';

import { Resource } from '../src/core/class-based/resource';

import type { ArgsFrom } from '../src/core/class-based/resource';
import type { Named, Positional } from '[core-types]';

/**
 * Base class
 */
expectTypeOf<Resource['modify']>().parameters.toEqualTypeOf<
  [Positional<unknown>, Named<unknown>]
>();

/**
 * Helpers
 */
interface SimpleArgs {
  Positional: [number, string];
}
class SomeResource extends Resource<SimpleArgs> {}
class SomeOtherResource<Args> extends Resource<Args> {}
class SomeClass {
  foo = 'hello';
}

expectTypeOf<ArgsFrom<Resource<SimpleArgs>>>().toEqualTypeOf<SimpleArgs>();

expectTypeOf<ArgsFrom<SomeResource>>().toEqualTypeOf<SimpleArgs>();

expectTypeOf<ArgsFrom<SomeOtherResource<SimpleArgs>>>().toEqualTypeOf<SimpleArgs>();

// SomeClass is not a sub-class of Resource
// @ts-expect-error
expectTypeOf<ArgsFrom<SomeClass>>().toEqualTypeOf<never>();

// unknown is not a sub-class of Resource
// @ts-expect-error
expectTypeOf<ArgsFrom<unknown>>().toEqualTypeOf<never>();

/**
 * with no arguments specified
 */
class A extends Resource {
  a = 1;
}

// @ts-expect-error
A.from({});

/**
 * with all arguments specified
 */
type BArgs = {
  positional: [number, string];
  named: {
    num: number;
    str: string;
  };
};

export class B<Args = BArgs> extends Resource<Args> {
  b = 'b';
}

expectTypeOf<B['modify']>().parameters.toEqualTypeOf<[Positional<BArgs>, Named<BArgs>]>();
expectTypeOf<ArgsFrom<B>>().toEqualTypeOf<BArgs>();

/**
 * with all arguments, but capitalized (Signature style)
 */

type CArgs = {
  Positional: [number, string];
  Named: {
    /**
     * How do I test / assert JSDoc is carried?
     * (it is, but I can't prove it)
     * docs?
     */
    num: number;
    str: string;
  };
};

export class C extends Resource<CArgs> {
  c = 'c';
}

expectTypeOf<C['modify']>().parameters.toEqualTypeOf<[Positional<CArgs>, Named<CArgs>]>();
expectTypeOf<ArgsFrom<C>>().toEqualTypeOf<CArgs>();

C.from(() => ({ positional: [1, 'hi'], named: { num: 2, str: 'hi' } }));
C.from({}, () => ({ positional: [1, 'hi'], named: { num: 2, str: 'hi' } }));

/**
 * With only positional args
 */
export class Doubler extends Resource<{ positional: [number] }> {
  doubled = 2;
}

Doubler.from(() => [1]);
Doubler.from({}, () => [2]);
