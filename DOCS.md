# Authoring Resources

In this document, you'll learn about the core features of `ember-resources`
and how to decide which primitives to use, how to create, support, compose, and test with them.

- [the primitives](#the-primitives)
  - [function-based Resources](#function-based-resources)
    - [Example: Clock](#example-clock)
  - [class-based Resources](#class-based-resources)
    - [Example: Clock](#example-class-based-clock)

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


[mdn-setInterval]: https://developer.mozilla.org/en-US/docs/Web/API/setInterval
[mdn-clearInterval]: https://developer.mozilla.org/en-US/docs/Web/API/clearInterval
[mdn-DateTimeFormat]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat

### class-based resources

[🔝 back to top](#authoring-resources)

Class-based resources are good for object-oriented encapsulation of state,
giving access to the application container / owner for service injection,
and/or persistint state across argument changes.


Though, maybe a more pragmatic approach to the difference:

_Class-based resources can be invoked with args_.
Function-based resources must be wrapped in another function to accept args.

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




