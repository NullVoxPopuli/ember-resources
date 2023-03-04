import { Resource, use } from 'ember-resources';
import { expectTypeOf } from 'expect-type';
import { expectType } from 'ts-expect';

import type { ExpandArgs, Thunk } from 'ember-resources';
// This is private, but we test it for sanity
// because when this was added, I had none.
import type { ArgsFrom } from 'ember-resources/core/class-based/resource';

class A extends Resource {
  a = 1;
}

expectTypeOf(A.from(() => ({}))).toEqualTypeOf<A>();
expectTypeOf(A.from(() => ({})).a).toEqualTypeOf<number>();

type BArgs = {
  positional: [number, string];
  named: {
    num: number;
    str: string;
  };
};

export class B extends Resource<BArgs> {
  b = 'b';
}

expectTypeOf<ArgsFrom<B>>().toEqualTypeOf<BArgs>();

expectTypeOf<Parameters<NonNullable<B['modify']>>>().toEqualTypeOf<
  [[number, string], { num: number; str: string }]
>();

B.from(() => ({ positional: [1, 'two'], named: { num: 3, str: 'four' } }));
B.from({}, () => ({ positional: [1, 'two'], named: { num: 3, str: 'four' } }));

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

expectTypeOf<Parameters<NonNullable<C['modify']>>>().toEqualTypeOf<
  [[number, string], { num: number; str: string }]
>();

C.from(() => ({ positional: [1, 'two'], named: { num: 3, str: 'four' } }));
C.from({}, () => ({ positional: [1, 'two'], named: { num: 3, str: 'four' } }));

export class UsageC {
  @use cUse = C.from(() => ({ positional: [1, 'two'], named: { num: 3, str: 'four' } }));
  cThis = C.from(this, () => ({ positional: [1, 'two'], named: { num: 3, str: 'four' } }));
}

expectType<C>(new UsageC().cUse);
expectType<C>(new UsageC().cThis);

// @use c = C.from(() => ...)
expectTypeOf<Thunk>().toMatchTypeOf<Parameters<typeof C.from>[0]>();

/**
 * Userland Generics
 */
export class D<Element = unknown> extends Resource<{ Positional: Element[] }> {
  d = 'd';
}

expectTypeOf<ArgsFrom<D<number>>>().toEqualTypeOf<{ Positional: number[] }>();

// @ts-expect-error no string is allowed
D.from<D<number>>(() => [1, 'two']);
// Unfortunately, we can't infer much here, so we kinda have anything allowed
D.from(() => ({ positional: [1, 'two'] }));
// @ts-expect-error but we can at least know that we want positional, and not named
D.from(() => ({ named: { foo: 2 } }));

D.from<D<number>>(() => ({ positional: [1, 2] }));
D.from<D<number>>({}, () => ({ positional: [1, 2] }));

type EArgs<T = unknown> = {
  Positional: [];
  Named: {
    foo: T;
  };
};

export class E<MyType = unknown> extends Resource<EArgs<MyType>> {
  modify(
    positional: ExpandArgs<EArgs<MyType>>['Positional'],
    named: ExpandArgs<EArgs<MyType>>['Named']
  ) {
    expectType<never[]>(positional);
    expectType<{ foo: MyType }>(named);
  }
}

export class EUsage {
  foo = 2;
  // Available in TS 4.7+
  // prettier-ignore
  myInstance = (E<number>).from(() => ({ foo: this.foo }));
}
