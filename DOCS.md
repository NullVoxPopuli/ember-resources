# Authoring Resources

In this document, you'll learn about the core features of `ember-resources`
and how to decide which primitives to use, how to create, support, compose, and test with them.

- [function-based Resources](#function-based-resources)
    - [Lifecycle](#lifecycles-with-resource)
    - [Reactivity](#reactivity)
    - [Example: Clock](#example-clock): Managing own state
    - [Example: `fetch`](#example-fetch): Async + lifecycle

### function-based resources

[🔝 back to top](#authoring-resources)

Function resources are good for both authoring encapsulated behaviors,
as well as inline / "on-demand" usage.

#### Lifecycles with `resource`

The function provided to `resource` is synchronous, has no `this`, and no way to accept arguments.
But there is a micro-api provided to the function passed to `resource` for cleanup.

```js
const myResource = resource(({ on }) => {
  // initial setup, updates, etc

  on.cleanup(() => {
    /* cleanup handled here */
  })

  return /* some value or synchronous function which returns a value */
});
```

When a resource is wrapped in a function for the purpose of receiving configurable arguments,
the semantics may change slightly
```js
const ArgUsingResource = (someArg) => {
  // setup, updates for any time args change

  return resource(({ on }) => {
    // setup and updates can still be handled here

    // resource's cleanup is ran if args change
    on.cleanup(() => {
      /* cleanup handled here */
    })

    return /* some value or synchronous function which returns a value */
  });
}
```

#### Reactivity

function-based resources are _implicitly_ reactive,
in that there is no ceramony required by the consumer to make them reactive
or update in response to changes in reactive source-data.

For example, consider a resource that doubles a number (this is over engineered, and you wouldn't want a resource for doubling a number)

```js
import { tracked } from '@glimmer/tracking';
import { resource, use } from 'ember-resources';

class {
  @tracked num = 2;

  @use doubled = resource(() => this.num * 2);
}
```

When accessed, the value of `doubled` will be `4`.
Any time `this.num` changes, the value of `doubled` will be a number that is 2 times `this.num`.

This happens lazily, so if `doubled` is not accessed,
the resource is not evaluated and no computation efforts are done.

Accessing can be done anywhere at any time, in JS, or in a Template (it's the same).

If you wanted your `resource` to maintain some state of its own, you'd want to make sure
that you don't _invalidate_ any tracked state that is also consumed in the main function-body of the resource.

```js
import { tracked } from '@glimmer/tracking';
import { resource, use } from 'ember-resources';
import { TrackedObject } from 'tracked-built-ins';

class {
  @tracked locale = 'en-US';

  @use clock = resource(() => {
    let time = new TrackedObject({ current: new Date() });
    // changes to locale would invalidate the whole resource, re-invoking the top-level function
    let formatter = new Intl.DateTimeFormat(this.locale, { /* ... */ });

    // time.current is not accessed in this outer function scope,
    // so changing the value does not invalidate the resource body.
    setInterval(() => time.current = new Date(), 1_000);

    // changes to `time.current` only invalidate this function
    return () => formatter.format(time.current);
  });
}
```

For a more in-depth explanation, see the `Clock` example below.



#### Example: Clock

[🔝 back to top](#authoring-resources)

Throughout these examples, we'll implement a locale-aware clock
and go over the tradeoffs / behavior differences between
each of the implementations and usages (from the consuming side).

The goal if this implementation is to provide an easy abstraction that
"some consumer" could use to display the current time in their given locale.

To start, we'll want to use [`setInterval`][mdn-setInterval] to update a value every second.
```js
// NOTE: this snippet has bugs and is incomplete, don't copy this (explained later)
import { resource, use } from 'ember-resources';
import { TrackedObject } from 'tracked-built-ins';

const clock = resource(() => {
  let time = new TrackedObject({ current: new Date() });

  setInterval(() => (time.current = new Date()), 1_000);

  return time.current;
});
```

Usage of this resource would look like
```hbs
<time>{{clock}}</time>
```


<details><summary>using &lt;template&gt;</summary>

```js
// NOTE: this snippet has bugs and is incomplete, don't copy this (explained later)
import { resource, use } from 'ember-resources';
import { TrackedObject } from 'tracked-built-ins';

const clock = resource(() => {
  let time = new TrackedObject({ current: new Date() });

  setInterval(() => (time.current = new Date()), 1_000);

  return time.current;
});

<template>
  <time>{{clock}}</time>
</template>
```

</details>
<details><summary>using in a glimmer component or class</summary>

```js
class {
  @use myClock = clock;

  get now() {
    return this.myClock; // the formatted time
  }
}
```

</details>



But this is not feature-complete! We still need to handle cleanup to prevent memory leaks by using [`clearInterval`][mdn-clearInterval].

```diff
- const clock = resource(() => {
+ const clock = resource(({ on }) => {
    let time = new TrackedObject({ current: new Date() });

-   setInterval(() => (time.current = new Date()), 1_000);
+   let interval = setInterval(() => (time.current = new Date()), 1_000);
+
+   on.cleanup(() => clearInteral(interval))

    return time.current;
```

Now when the `resource` updates or is torn down, won't leave a bunch of `setInterval`s running.

Lastly, adding in locale-aware formatting with [`Intl.DateTimeFormat`][mdn-DateTimeFormat].
```diff
    on.cleanup(() => clearInteral(interval))

-   return time.current;
+   return new Intl.DateTimeFormat('en-US', {
+     hour: 'numeric',
+     minute: 'numeric',
+     second: 'numeric',
+     hour12: false,
+   }).format(time.current);
```


However, there is a goofy behavior with this implementation.
By accessing `time.current`, we end up consuming tracaked data within the `resource`
callback function. When `setInterval` updates `time.current`, the reactivity system
detects that "tracked data that was consumed in the `resource` callback has changed,
and must re-evaluate".
This causes a _new_ `setInterval` and _new_ `TrackedObject` to be used,
rather than re-using the objects.

To solve this, we need to enclose access to the tracked data via an arrow function.
```diff
  const clock = resource(({ on }) => {
    let time = new TrackedObject({ current: new Date() });
    let interval = setInterval(() => (time.current = new Date()), 1_000);

    on.cleanup(() => clearInteral(interval))

-   return new Intl.DateTimeFormat('en-US', { /* ... ✂️ ...*/ });
+   let formatter = new Intl.DateTimeFormat('en-US', { /* ... ✂️ ...*/ });
+
+   return () => formatter.format(time.current);
  });
```

In this resource, consumed tracked data, when changed, only invalidates the enclosing function.

Lastly, to support reactively changing the locale, we need to wrap the `resource` in a function. Here is the final code:
```js
import { resource, resourceFactory, use } from 'ember-resources';

const Clock = resourceFactory((locale = 'en-US') => {
  return resource(({ on }) => {
    let time = new TrackedObject({ current: new Date() });
    let interval = setInterval(() => (time.current = new Date()), 1_000);

    on.cleanup(() => clearInteral(interval))

    let formatter = new Intl.DateTimeFormat(locale, { /* ... ✂️ ...*/ });

    return () => formatter.format(time.current);
  });
});
```

<details><summary>using &lt;template&gt;</summary>

```js
// NOTE: this snippet has bugs and is incomplete, don't copy this (explained later)
import { resource, resourceFactory, use } from 'ember-resources';

const Clock = resourceFactory((locale = 'en-US') => {
  return resource(({ on }) => {
    let time = new TrackedObject({ current: new Date() });
    let interval = setInterval(() => (time.current = new Date()), 1_000);

    on.cleanup(() => clearInteral(interval))

    let formatter = new Intl.DateTimeFormat(locale, { /* ... ✂️ ...*/ });

    return () => formatter.format(time.current);
  });
});

<template>
  <time>{{Clock}}</time>
</template>
```

</details>

Up until now, all we've needed in the template for these clocks to work is to have `{{clock}}` in our template.
But becasue we now need to pass data to a function, we need to invoke that function. The `resourceFactory` utility handles some framework-wiring so that the `Clock` function can immediately invoke the `resource` function.

```hbs
{{ (Clock 'en-GB') }}
```

<details><summary>using in a glimmer component or class</summary>

```js
class {
  @use clock = Clock('en-GB');

  get now() {
    return this.clock; // the formatted time
  }
}
```

</details>

-----------------------

Supporting reactive argument changes from JS would require an arrow function to be passed to `Clock` so that the `resource` can consume the entangle with data.

```js
import { resource, resourceFactory, use } from 'ember-resources';

const Clock = resourceFactory((locale = 'en-US') => {
  return resource(({ on }) => {
    let currentLocale = locale;

if (typeof locale === 'function') {
      currentLocale = locale();
    }

    let time = new TrackedObject({ current: new Date() });
    let interval = setInterval(() => (time.current = new Date()), 1_000);

    on.cleanup(() => clearInteral(interval))

    let formatter = new Intl.DateTimeFormat(currentLocale, { /* ... ✂️ ...*/ });

    return () => formatter.format(time.current);
  });
});
```

and then usage in a class would look like:

```js
class {
  @tracked locale = 'en-GB';

  @use clock = Clock(() => this.locale);

  get now() {
    return this.clock; // the formatted time
  }
}
```


[mdn-setInterval]: https://developer.mozilla.org/en-US/docs/Web/API/setInterval
[mdn-clearInterval]: https://developer.mozilla.org/en-US/docs/Web/API/clearInterval
[mdn-DateTimeFormat]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat

#### Example: Fetch

[🔝 back to top](#authoring-resources)

See: Cookbook entry, [`fetch` with `AbortController`](https://github.com/NullVoxPopuli/ember-resources/blob/main/docs/docs/cookbook/fetch-with-AbortController.md#using-resource-1)

