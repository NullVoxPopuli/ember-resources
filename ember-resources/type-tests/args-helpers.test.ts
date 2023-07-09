import { expectTypeOf } from 'expect-type';

import { Resource } from '../src/core/class-based';

import type { ArgsFrom } from '../src/core/class-based/resource';
import type { EmptyObject, Named, Positional } from '[core-types]';

// -----------------------------------------------------------
// -----------------------------------------------------------
// -----------------------------------------------------------

/**
 * -----------------------------------------------------------
 * Named
 * -----------------------------------------------------------
 */
expectTypeOf<Named<unknown>>().toEqualTypeOf<EmptyObject>();
expectTypeOf<Named<{ named: { foo: number } }>>().toEqualTypeOf<{ foo: number }>();
expectTypeOf<Named<{ Named: { foo: number } }>>().toEqualTypeOf<{ foo: number }>();
expectTypeOf<Named<{ positional: [] }>>().toEqualTypeOf<EmptyObject>();
expectTypeOf<Named<{ Positional: [] }>>().toEqualTypeOf<EmptyObject>();
expectTypeOf<Named<{ Named: { foo: number }; Positional: [] }>>().toEqualTypeOf<{ foo: number }>();
// @ts-expect-error
expectTypeOf<Named<{ named: { foo: number }; Positional: [] }>>().toEqualTypeOf<{ foo: number }>();

/**
 * -----------------------------------------------------------
 * Positional
 * -----------------------------------------------------------
 */
expectTypeOf<Positional<unknown>>().toEqualTypeOf<[]>();
expectTypeOf<Positional<{ positional: [number] }>>().toEqualTypeOf<[number]>();
expectTypeOf<Positional<{ Positional: [number] }>>().toEqualTypeOf<[number]>();
expectTypeOf<Positional<{ named: { foo: number } }>>().toEqualTypeOf<[]>();
expectTypeOf<Positional<{ Named: { foo: number } }>>().toEqualTypeOf<[]>();
expectTypeOf<Positional<{ Named: { foo: number }; Positional: [number] }>>().toEqualTypeOf<
  [number]
>();
// @ts-expect-error
expectTypeOf<Positional<{ Named: { foo: number }; positional: [number] }>>().toEqualTypeOf<
  [number]
>();

/**
 * -----------------------------------------------------------
 * ArgsFrom
 * -----------------------------------------------------------
 */
class Foo {
  foo = 'foo';
}
class Bar extends Resource {
  bar = 'bar';
}
class Baz extends Resource<{ Named: { baz: string } }> {
  baz = 'baz';
}
class Bax extends Resource<{ Positional: [string] }> {
  bax = 'bax';
}
// {} does not extend Resource
// @ts-expect-error
expectTypeOf<ArgsFrom<{}>>().toEqualTypeOf<never>();
// unknown does not extend Resource
// @ts-expect-error
expectTypeOf<ArgsFrom<unknown>>().toEqualTypeOf<never>();
// number does not extend Resource
// @ts-expect-error
expectTypeOf<ArgsFrom<2>>().toEqualTypeOf<never>();
// string does not extend Resource
// @ts-expect-error
expectTypeOf<ArgsFrom<'string'>>().toEqualTypeOf<never>();
// Foo does not extend Resource
// @ts-expect-error
expectTypeOf<ArgsFrom<Foo>>().toEqualTypeOf<never>();

expectTypeOf<ArgsFrom<Bar>>().toEqualTypeOf<unknown>();
expectTypeOf<ArgsFrom<Baz>>().toEqualTypeOf<{ Named: { baz: string } }>();
expectTypeOf<ArgsFrom<Bax>>().toEqualTypeOf<{ Positional: [string] }>();
