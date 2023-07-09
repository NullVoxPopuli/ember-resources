/**
 * These type tests are sorted alphabetically by the name of the type utility
 */
import { expectTypeOf } from 'expect-type';

import type { AsThunk, EmptyObject, LoosenThunkReturn, NoArgs, ThunkReturnFor } from '[core-types]';

/**
 * -----------------------------------------------------------
 * AsThunk - uses ThunkReturnFor + LoosenThunkReturn
 * -----------------------------------------------------------
 */
expectTypeOf<AsThunk<{}>>().toEqualTypeOf<() => NoArgs | [] | EmptyObject | undefined | void>();
expectTypeOf<AsThunk<unknown>>().toEqualTypeOf<
  () => NoArgs | [] | EmptyObject | undefined | void
>();
expectTypeOf<AsThunk<[]>>().toEqualTypeOf<() => NoArgs | [] | EmptyObject | undefined | void>();
expectTypeOf<AsThunk<{ foo: number }>>().toEqualTypeOf<
  () => NoArgs | [] | EmptyObject | undefined | void
>();

expectTypeOf<AsThunk<{ named: { foo: number } }>>().toEqualTypeOf<
  () => { named: { foo: number } } | { foo: number }
>();
expectTypeOf<AsThunk<{ named: { foo: number }; positional: [string] }>>().toEqualTypeOf<
  () => { named: { foo: number }; positional: [string] }
>();
expectTypeOf<AsThunk<{ positional: [number] }>>().toEqualTypeOf<
  () => { positional: [number] } | [number]
>();

/**
 * -----------------------------------------------------------
 * LoosenThunkReturn
 * -----------------------------------------------------------
 */
expectTypeOf<LoosenThunkReturn<{ named: { foo: 1 }; positional: [] }>>().toEqualTypeOf<
  { foo: 1 } | { named: { foo: 1 } }
>();
expectTypeOf<LoosenThunkReturn<{ named: EmptyObject; positional: [string] }>>().toEqualTypeOf<
  [string] | { positional: [string] }
>();
expectTypeOf<LoosenThunkReturn<{ named: { foo: 1 }; positional: [string] }>>().toEqualTypeOf<{
  named: { foo: 1 };
  positional: [string];
}>();

/**
 * -----------------------------------------------------------
 * ThunkReturnFor
 * -----------------------------------------------------------
 */
expectTypeOf<ThunkReturnFor<{}>>().toEqualTypeOf<NoArgs>();
expectTypeOf<ThunkReturnFor<unknown>>().toEqualTypeOf<NoArgs>();
expectTypeOf<ThunkReturnFor<object>>().toEqualTypeOf<NoArgs>();
// How to guard against this situation?
// expectTypeOf<ThunkReturnFor<Record<string, unknown>>>().toEqualTypeOf<NoArgs>();
expectTypeOf<ThunkReturnFor<{ positional: [string] }>>().toEqualTypeOf<{
  positional: [string];
  named: EmptyObject;
}>();
expectTypeOf<ThunkReturnFor<{ Positional: [string] }>>().toEqualTypeOf<{
  positional: [string];
  named: EmptyObject;
}>();
expectTypeOf<ThunkReturnFor<{ named: { baz: string } }>>().toEqualTypeOf<{
  positional: [];
  named: { baz: string };
}>();
expectTypeOf<ThunkReturnFor<{ Named: { baz: string } }>>().toEqualTypeOf<{
  positional: [];
  named: { baz: string };
}>();
