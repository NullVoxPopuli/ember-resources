---
"ember-resources": minor
---

`trackedFunction` can now be composed just like regular resources.

The function body still auto-tracks and will update within consuming resource appropriately.

<details><summary>Example</summary>

```ts
const Person = resourceFactory((maybeIdFn) => {
  return resource(({ use }) => {
    let request = use(
      trackedFunction(async () => {
        let id = typeof maybeIdFn === "function" ? maybeIdFn() : maybeIdFn;
        let response = await fetch(`https://api.github.com/users/${id}`);
        return response.json();
      })
    );

    // `use` returns a ReadonlyCell where `.current`
    // is the State of trackedFunction.
    return () => request.current;
  });
});
```

Usage examples:

```gjs
<template>
    {{#let (Person 1) as |request|}}
      {{#if request.isLoading}}
         ... loading ...
      {{/if}}

      {{#if request.value}}

      {{/if}}
    {{/let}}
</template>
```

</details>

<details><summary>An async doubler</summary>

```ts
const Doubled = resourceFactory((num: number) => {
  return resource(({ use }) => {
    let doubler = use(trackedFunction(async () => num * 2));

    // Since current is the "State" of `trackedFunction`,
    // accessing .value on it means that the overall value of
    // `Doubled` is the eventual return value of the `trackedFunction`
    return () => doubler.current.value;
  });
});

// Actual code from a test
class State {
  @tracked num = 2;
}

let state = new State();

setOwner(state, this.owner);

await render(<template><out>{{Doubled state.num}}</out></template>);
```

</details>

<details><summary>Example with arguments</summary>

Imagine you want to compute the hypotenuse of a triangle,
but all calculations are asynchronous (maybe the measurements exist on external APIs or something).

```ts
// Actual code from a test
type NumberThunk = () => number;

const Sqrt = resourceFactory((numFn: NumberThunk) =>
  trackedFunction(async () => {
    let num = numFn();

    return Math.sqrt(num);
  })
);

const Squared = resourceFactory((numFn: NumberThunk) =>
  trackedFunction(async () => {
    let num = numFn();

    return Math.pow(num, 2);
  })
);

const Hypotenuse = resourceFactory((aFn: NumberThunk, bFn: NumberThunk) => {
  return resource(({ use }) => {
    const aSquared = use(Squared(aFn));
    const bSquared = use(Squared(bFn));
    const c = use(
      Sqrt(() => {
        return (aSquared.current.value ?? 0) + (bSquared.current.value ?? 0);
      })
    );

    // We use the function return because we want this property chain
    // to be what's lazily evaluated -- in this example, since
    // we want to return the hypotenuse, we don't (atm)
    // care about loading / error state, etc.
    // In real apps, you might care about loading state though!
    return () => c.current.value;

    // In situations where you care about forwarding other states,
    // you could do this
    return {
      get value() {
        return c.current.value;
      },
      get isLoading() {
        return (
          a.current.isLoading || b.current.isLoading || c.current.isLoading
        );
      },
    };
  });
});
```

</details>
