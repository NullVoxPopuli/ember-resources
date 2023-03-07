---
"ember-resources": major
---

The `map` utility resource has changed its first type-argument for better inference.

The utility already supported inference, so this change should not impact too many folks.

<details><summary>Migration and Reasoning</summary>

When explicit type-arguments were specified,

```ts
class Demo {
  // previously
  a = map<Element>(this, {
    data: () => [
      /* ... list of Element(s) ... */
    ],
    map: (element) => {
      /* some transform */
    },
  });

  // now
  a = map<Element[]>(this, {
    data: () => [
      /* ... list of Element(s) ... */
    ],
    map: (element) => {
      /* some transform */
    },
  });
}
```

This is advantageous, because with `@tsconfig/ember`, the option `noUncheckedIndexedAccess`
is enabled by default. This is a great strictness / quality option to have enabled,
as arrays in javascript are mutable, and we can't guarantee that they don't change between
index-accesses.

_However_ the `map` utility resource explicitly disallows the indicies to get out of sync
with the source `data`.

But!, with `noUncheckedIndexedAccess`, you can only infer so much before TS goes the safe route,
and makes the returned type `X | undefined`.

For example, in these type-tests:

```ts
import { map } from "ember-resources/util/map";
import { expectType } from "ts-expect";

const constArray = [1, 2, 3];

b = map(this, {
  data: () => constArray,
  map: (element) => {
    expectType<number>(element);
    return element;
  },
});

// index-access here is *safely* `| undefined`, due to `constArray` being mutable.
expectType<number | undefined>(b[0]);
expectType<number | undefined>(b.values()[0]);

// but when we use a const as const array, we define a tuple,
// and can correctly infer and return real values via index access
const tupleArray = [1, 2, 3] as const;

c = map(this, {
  data: () => tupleArray,
  map: (element) => {
    expectType<number>(element);
    return element;
  },
});

// No `| undefined` here
expectType<number>(c[0]);
expectType<number>(c.values()[0]);
```

</details>
