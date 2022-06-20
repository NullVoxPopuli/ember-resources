# Authoring Resources

In this document, you'll learn about the core features of `ember-resources`
and how to decide which primitives to use, how to create, support, compose, and test with them.

- [the primitives](#the-primitives)
  - [function-based Resources](#function-based-resources)
    - [Lifecycle](#lifecycles-with-resource)
    - [Reactivity](#reactivity)
    - [Example: Clock](#example-clock): Managing own state
    - [Example: `fetch`](#example-fetch): Async + lifecycle
  - [class-based Resources](#class-based-resources)
    - [Lifecycle](#lifecycles-with-resource-1)
    - [Reactivity](#reactivity-1)
    - [Example: Clock](#example-class-based-clock): Managing own state
    - [Example: `fetch`](#example-class-based-fetch): Async + lifecycle

## the primitives

There are two core abstractions to working with resources,
each with their own set of tradeoffs and capabilities
-- but ultimately are both summarized as "helpers with optional state and optional cleanup".

|    | class-based [`Resource`][docs-class-resource] | function-based [`resource`][docs-function-resource] |
| -- | ---------------------- | ------------------------- |
| supports direct invocation in [`<templates>`][rfc-779] | yes | yes |
| supports [Glint][gh-glint] | soon | soon |
| provides a value | the instance of the class is the value[^1] | can represent a primitive value or complex object[^2] |
| can be invoked with arguments | yes, received via `modify`[^3] hook | only when wrapped with a function. changes to arguments will cause the resource to teardown and re-run |
| persisted state across argument changes | yes | no, but it's possible[^4] |
| can be used in the body of a class component | yes | yes |
| can be used in template-only components | yes[^5] | yes[^5] |
| requires decorator usage (`@use`) | `@use` optional | `@use` optional[^6] |


[rfc-779]: https://github.com/emberjs/rfcs/pull/779
[gh-glint]: https://github.com/typed-ember/glint
[gh-ember-modifier]: https://github.com/ember-modifier/ember-modifier

[docs-class-resource]: https://ember-resources.pages.dev/classes/core.Resource
[docs-function-resource]: https://ember-resources.pages.dev/modules/util_function_resource#resource

[mdn-weakmap]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap

[^1]: class-based resources _cannot_ be a single primitive value. APIs for support for this have been explored in the past, but it proved unergonomic and fine-grained reactivity _per accessed property_ (when an object was desired for "the value") was not possible.
[^2]: there are alternate ways to shape a function-resource depending on the behavior you want. These shapes and use cases are covered in the [function-based Resources](#function-based-resources).
[^3]: this is the same API / behavior as class-based modifiers in [ember-modifier][gh-ember-modifier].
[^4]: persisting state across argument changes with function-based resources might require a [`WeakMap`][mdn-weakmap] and some stable object to reference as the key for the storage within that `WeakMap`.
[^5]: for `.hbs` files the resources will need to be globally available via `export default`s from the `app/helpers` directory.
[^6]: without `@use`, the function-based resource must represent a non-primitive value or object.

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
// import { resource } from 'ember-resources'; // in V5
import { resource } from 'ember-resources/util/function-resource';

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
// import { resource } from 'ember-resources'; // in V5
import { resource } from 'ember-resources/util/function-resource';
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
// import { resource } from 'ember-resources'; // in V5
import { resource } from 'ember-resources/util/function-resource';
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
Or if you needed the value in JS
```js
class {
  @use myClock = clock;

  get now() {
    return this.myClock; // the formatted time
  }
}
```

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
```js
const clock = resource(({ on }) => {
  let time = new TrackedObject({ current: new Date() });
  let interval = setInterval(() => (time.current = new Date()), 1_000);

  on.cleanup(() => clearInteral(interval))

  let formatter = new Intl.DateTimeFormat('en-US', { /* ... ✂️ ...*/ });

  return () => formatter.format(time.current);
});
```

In this resource, consumed tracked data, when changed, only invalidates the enclosing function.

Lastly, to support reactively changing the locale, we need to wrap the `resource` in a function.
```js
// import { resource, resourceFactory } from 'ember-resources'; // in V5
import { resource, resourceFactory } from 'ember-resources/util/function-resource';

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

Up until now, all we've needed in the template for these clocks to work is to have `{{clock}}` in our template.
But becasue we now need to pass data to a function, we need to invoke that function. The `resourceFactory` utility handles some framework-wiring so that the `Clock` function can immediately invoke the `resource` function.

```hbs
{{ (Clock 'en-GB') }}
```

Or if you needed the value in JS
```js
class {
  @use clock = Clock(() => ['en-GB']);

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

### class-based resources

[🔝 back to top](#authoring-resources)

Class-based resources are good for object-oriented encapsulation of state,
giving access to the application container / owner for service injection,
and/or persistint state across argument changes.


Though, maybe a more pragmatic approach to the difference:

_Class-based resources can be invoked with args_.
Function-based resources must be wrapped in another function to accept args.

#### Lifecycles with `Resource`

There is only one lifecycle hook, `modify`, to encourage data-derivation (via getters) and
generally simpler state-management than you'd otherwise see with with additional lifecycle methods.

For example, this is how you'd handle initial setup, updates, and teardown with a `Resource`

```js
import { Resource } from 'ember-resources/core';
import { registerDestructor } from '@ember/destroyable';

class MyResource extends Resource {
  // constructor only needed if teardown is needed
  constructor(owner) {
    super(owner);

    registerDestructor(this, () => {
      // final teardown, if needed
    });
  }

  modify(positional, named) {
    // initial setup, updates, etc
  }
}
```
Many times, however, you may not even need to worry about destruction,
which is partially what makes opting in to having a "destructor" so fun --
you get to choose how much lifecycle your `Resource` has.

More info: [`@ember/destroyable`](https://api.emberjs.com/ember/release/modules/@ember%2Fdestroyable)

#### Reactivity

class-based Resources have lazy, usage-based reactivity based on whatever is accessed in the `modify` hook.

For example, consider a resource that doubles a number (this is over engineered, and you wouldn't want a Resource for doubling a number)

```js
import { tracked } from '@glimmer/tracking';
// import { Resource } from 'ember-resources'; // in V5
import { Resource } from 'ember-resources/core';

class Doubler extends Resource {
  @tracked result = NaN;

  modify([num]) {
    this.result = num * 2;
  }
}

class {
  @tracked num = 2;

  doubler = Doubler.from(() => [this.num]);
}
```

When accessed, the value of `doubler.result` will be `4`.
Any time `this.num` changes, the value of `doubler.result` will be `8`.

This happens lazily, so if `doubler.result` is not accessed,
the Resource is not evaluated and no computation efforts are done.

Accessing can be done anywhere at any time, in JS, or in a Template (it's the same).

A class-based Resource can define its own state anywhere, but has the same stipulations
as the function-based Resource: inside the `modify` hook, you may not access a tracked
property that is later written to. This causes an infinte loop while the framework tries to resolve what the stable "value" should be.

See the `Clock` example below for more details.

#### Example: class-based Clock

Given the complete example of a `clock` above implemented in a function-based resource,
A complete implementation, as a class-based resource could look similar to this:

```js
// import { Resource } from 'ember-resources'; // in V5
import { Resource } from 'ember-resources/core'
import { tracked } from '@glimmer/tracking';
import { registerDestructor } from '@ember/destroyable';

class Clock extends Resource {
  @tracked current = new Date();

  constructor(owner) {
    super(owner);

    let interval = setInterval(() => (this.current = new Date()), 1_000);

    registerDestructor(this, () => clearInterval(interval));
  }

  get formatted() {
    return this.formatter.format(this.current);
  }

  modify([locale = 'en-US']) {
    this.formatter = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
  }
}
```

Resulting usage would look something like this:

```hbs
{{get (Clock 'en-GB') 'formatted'}}
```

Or if you needed the value in JS
```js
class {
  clock = Clock.from(this, () => ['en-GB']);

  get now() {
    return this.clock.formatted;
  }
}
```

#### Example: class-based Fetch

[🔝 back to top](#authoring-resources)

See: Cookbook entry, [`fetch` with `AbortController`](https://github.com/NullVoxPopuli/ember-resources/blob/main/docs/docs/cookbook/fetch-with-AbortController.md#using-resource)
