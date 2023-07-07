---
"ember-resources": minor
---

The `use` import from `ember-resources` now supports an alternate style of usage.
This is partly to provide consistency across the different kinds of resources (and resource builders), whether or not arguments are provided.

The motivation from this change comes from trying to better align with Starbeam's composition capabilities, and "define something once, use it anywhere" approach to that composition.

For example, before, only this was possible:

```js
import { resource, use } from "ember-resources";

const StuckClock = resource(() => 2);

class MyClass {
  @use data = StuckClock;
}

new MyClass().data === 2;
```

That looks a little awkward, because it looks like `data` is set to a constant.
In `TypeScript`, this still worked out, and the type of `data` would be a `number`,
but it still didn't look intuitive.

_Now, we can do this_:

```js
import { resource, use } from "ember-resources";

const StuckClock = resource(() => 2);

class MyClass {
  data = use(this, StuckClock);
}

new MyClass().data.current === 2;
```

The key difference here is that `data` is now a `Reactive<number>`, which, like a `cell`, has a `.current` property.
This is a _readonly_ value -- however `current` can still return a mutable data structure.

This style of `use` ends up extending nicely to Resources that take arguments:

```js
import { tracked } from "@glimmer/tracking";
import { resource, use, resourceFactory } from "ember-resources";

const Clock = resourceFactory((locale) => resource(/* ... */));

class MyClass {
  @tracked locale = "en-US";

  data = use(
    this,
    Clock(() => this.locale)
  );
}
```

> **Note** <br>
> The old way of using `@use` as a decorator is still supported, and has no plans of being deprecated.

<details><summary>Another approach</summary>

I can't recommend this approach for general usage, but it is supported under SemVer (for exploration and feedback).

```ts
import { resource, use } from "ember-resources";

const StuckClock = resource(() => 2);

class MyClass {
  @use(StuckClock) declare data: number;
}

new MyClass().data === 2;
```

This should feel familiar as it looks like what we're familiar with when it comes to declaring `@tracked` properties as well as `@service`s.

However, this has the same problems as `@service` -- in TypeScript, it requires you to use `declare` and specify a type, which may or may not match the actual type of `StuckClock`.

Additionally, whenever we want to pass arguments to the resource, like this:

```ts
import { tracked } from '@glimmer/tracking';
import { resource, use } from 'ember-resources';

const Clock = resourceFactory((locale) => resource( /* ... */);

class MyClass {
  @tracked locale = 'en-US';

  @use(Clock(() => this.locale) declare data: number;
}
```

The arrow function passed to `Clock` would not have the correct this.
This is confusing, because in every other situation where we use classes,
the arrow function has the same context as the instance of the class.
But due to how decorators are configured / transpiled, the `this` is actually the surrounding context around `MyClass`, because decorators are _statically applied_.

```ts
class MyClass {
  @tracked locale = 'en-US';

  @use(Clock( static context here, not instance ) declare data: number;
}
```

So... that's why I want to recommend `property = use(this, Foo)` by default.

```ts
class MyClass {
  @tracked locale = 'en-US';

  data = use(this, (Clock( instance access ));
}
```

</details>
