# Migrations

- [5.0](#5.0)
  - tl;dr
  - Overview
  - Nomenclature changes
  - LifecycleResource
  - Resource
  - Utilities

## 5.0

### tl;dr:

_Migration during the v4 series is available via different imports_.

**Upcoming breaking changes**

- No more `ember-concurrency@v1` support (though compatibility may still work)
- Removed exports:
  - `LifecycleResource`
  - constructor-oriented `Resource`
  - `@use`
- Renamed utilities:
  - `useResource` => `Resource.of`
  - `useHelper` => `helper`
  - `useTask` => `task` with alias `trackedTask`
- Changed behavior:
  - `trackedFunction`
    - no longer receives the previous value
    - will return `null` instead of `undefined` before resolving
    - no longer holds on to the previous return value when re-running

**New features**

- opt-in svelte-able imports, but lazy tree-shakable imports still available (import everything from `'ember-resources'`)
- `Array.prototype.map` as a resource
- new `Resource` class with sole `modify` hook
- `trackedFunction` now wraps [ember-async-data][e-async-data] for a richer way to inspect pending and error state


[e-async-data]: https://github.com/chriskrycho/ember-async-data

-----------------------------------

### Overview


Migrating to 5.0 requires some adjustments to how folks author Resources
 - `LifecycleResource` will be renamed to `Resource` and there will be a single `modify` hook
 - `Resource` will be removed
 - to opt-in to non-deprecated behaviors, there will be new import paths to use. Once 5.0 hits,
   the current top-level imports will re-export the classes and utilities from the new paths
   introduced in as a part of this migration effort (for convenience, totally optional)

For library authors wanting to implement these changes, they can _probably_ be done in a minor release,
as the reactivity and general APIs behave the same -- however, if there are any **potentially** breaking
changes in any of the APIs, they'll be called out below.


Primary goals of this migration:
- to align with the broader ecosystem -- specifically [ember-modifier](https://github.com/ember-modifier/ember-modifier), and simplifying class-based APIs
- improving semantics and nomenclature for resources, i.e.: not relying on other ecosystem's nomenclature for describing the utility APIs (e.g.: `use*`)
- provide an easy module-svelting approach for folks not yet using tree-shaking, but don't want every utility in the `ember-resources` package (i.e.: if you don't use it, you don't pay for it)

### Nomenclature changes

_`use*` is now either `*Of` or dropped entirely_

The reason for this is that the "useThing" isn't descriptive of what behavior is actually happening.
In many cases, folks are using resources to mean "a class that participates in auto-tracking" and while
there may be lifecycle-esque behaviors involved, depending on which implementation is in use, those are
ultimately an implementation detail of the resource author.

_Using a class that participates in autotracking_ may be as simple as adding something like this
in your component:

```js
@tracked foo;
@tracked bar;

@cached
get selection() {
  return new Selection(this.foo, this.bar);
}
```
Alternatively, because the above will create a new instance of `Selection` every time `this.foo` or
`this.bar` changes, you may want to individually reactive arguments to `Selection` so that
the initial returned instance of `Selection` is stable.
```js
@tracked foo;
@tracked bar;

@cached
get selection() {
  return new Selection({
    foo: () => this.foo,
    bar: () => this.bar,
  });
}
```
depending on your performance requirements, the above pattern can be very uplifting when you need
to write vanilla JS, have encapsulated state, and auto-tracked derived data within that encapsulated state.


**But back to "use"**, all of this is _using_ `Selection` -- and with the v4 and earlier APIs of `ember-resources`,
the correlating usage would be:
```js
selection = useResource(this, Selection, () => { /* ... */ });
```
or, following the "provide a single import to your consumers recommendation",
```js
selection = useSelection(this, { /* ... */ });
```

As a library author, you want APIs to be as straight-forward as possible, meeting people where their mental
models are at, without any extra noise -- this may be a provided API that _avoids_ `use`
```js
selection = someClass(this, { /* ... */ });
```

**Why "of"?**

`of` is already common nomenclature in JavaScript.
While `of` exists as a keyword in [`for ... of`][for-of] and [`for await ... of`][for-await-of],
the usage that is most similar to the changes proposed for `ember-resources`
v5 (introduced in a v4 minor) is [`Array.of`][array-of] and [`TypedArray.of`][typed-array-of].
For both `Array` and `TypedArray`, the `of` word, in-spirit, means "Create an instance (of myself) of this configuration".

For `Resource.of`, it's the same, "Create an instance of a 'Resource' with this configuration".


[array-of]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/of
[for-of]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of
[for-await-of]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
[typed-array-of]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/of

**Why omit any specifier?**

Consumers of your library do not need to and should not need to care about the specifics of how a `Resource`
is constructed.

For example, you're maybe providing a `Selection` Resource, a user will grok
`mySelection = selection(this, { /* ... */ })` much more easily than anything with additional words.
The omission of extra words is important, because it's less things to explain.
The lazy alternative may be `mySelection = Resource.of(this, Selection, () => { /* ... */ })`; multiple imports, a class, what's a Resource?, etc. Consumers of your library shouldn't need to know the specifics
of the implementation (the fact that resources are even a thing).

### LifecycleResource

#### `args`
#### `setup()`
#### `update()`
#### `teardown()`

Before
```js
import { LifecycleResource } from 'ember-resources';

class MyResource extends LifecycleResource {
  update() {}
  setup() {}
  teardown() {}
}
```
After
```js
import { Resource } from 'ember-resources/core';
import { registerDestructor } from '@ember/destroyable';

class MyResource extends Resource {
  constructor(owner, args) {
    super(owner, args);

    registerDestructor(this, () => {
      // cleanup
    });
  }

  modify(positionalArgs, namedArgs) {
    // update
  }
}
```

### Resource

Before
```js
import { Resource } from 'ember-resources';
import { registerDestructor } from '@ember/destroyable';

class MyResource extends Resource {
  constructor(owner, args, previous) {
    super(owner, args, previous);

    if (!previous) {
      // initial setup
    } else {
      // update
    }

    registerDestructor(this, () => {
      // teardown function for each instance
    });
  }
}
```

After
```js
import { Resource } from 'ember-resources/core';
import { registerDestructor } from '@ember/destroyable';

class MyResource extends Resource {
  constructor(owner, args) {
    super(owner, args);

    // initial setup

    registerDestructor(this, () => {
      // 🎵 it's the final teardown
    });
  }

  modify(positional, named) {
    // cleanup function for each update
    this.cleanup();

    // update
  }

  // ... ✂️  ...
}
```

### Utilities

#### `useTask`

_in v5 `ember-concurrency@v1` will no longer be supported_. This does not mean that `ember-concurrency@v1`
won't work, but it does mean that maintenance in `ember-resources` regarding `ember-concurrency@v1`
is no longer worth the effort.

#### `trackedFunction`


#### `use`

The `@use` decorator did not see much of any public usage and will be removed in `ember-resources@v5`

#### `useFunction`


#### `useHelper`


#### `useResource`


## References

Decisions are influenced by the [Code Search for `ember-resources`](https://emberobserver.com/code-search?codeQuery=ember-resources) on [Ember Observer](https://emberobserver.com) as well as internal usage and evolution within @NullVoxPopuli's work (as open source does not contain _everything_).

  Additional searches:
  - [`LifecycleResource`](https://emberobserver.com/code-search?codeQuery=LifecycleResource)
  - [`useResource`](https://emberobserver.com/code-search?codeQuery=useResource)
  - [`useFunction`](https://emberobserver.com/code-search?codeQuery=useFunction)
  - [`useHelper`](https://emberobserver.com/code-search?codeQuery=useHelper)
  - [`import { use }`](https://emberobserver.com/code-search?codeQuery=import%20%7B%20use%20%7D)
  - [`import { use`](https://emberobserver.com/code-search?codeQuery=import%20%7B%20use)


The [ember-modifiers v4 migration guide](https://github.com/ember-modifier/ember-modifier/blob/master/MIGRATIONS.md) that much of this document is based off of.



