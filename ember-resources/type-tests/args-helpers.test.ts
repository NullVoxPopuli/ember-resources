import { expectTypeOf } from 'expect-type';

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

