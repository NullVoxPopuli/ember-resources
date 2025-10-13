# Migrations




- [7.0](#7.0)
- [5.0](#5.0)
  - [tl;dr](#tldr)
  - [Overview](#overview)
  - [Nomenclature changes](#nomenclature-changes)
  - [LifecycleResource](#lifecycleresource)
  - [Resource](#resource)
    - [args](#args)
    - [setup](#setup)
    - [update](#update)
    - [teardown](#teardown)
  - [Utilities](#utilities)
    - [useTask](#usetask)
    - [useFunction](#usefunction)
    - [useHelper](#usehelper)
    - [useResource](#useresource);
  - [References](#references)

## 7.0

Run the migrator to automate this upgrade -- there are no breaking changes, no API changes, only changes in where imports occur.

```bash
npx ember-resources-codemod
```

This codemod runs on all js, ts, gjs, and gts files from within the invoked current working directory.

The source for the codemod is [here](https://github.com/NullVoxPopuli/ember-resources/tree/main/codemod) and if anyone runs in to any problems, please open an issue <3



- Class-based resource implementation moved to [ember-modify-based-class-resource](https://github.com/NullVoxPopuli/ember-modify-based-class-resource/)

  <details><summary>How to use class-based state in a resource</summary>

    See discussion from: https://github.com/NullVoxPopuli/ember-resources/issues/707#issuecomment-1355189452
    
    ```js
    import { use, resource } from 'ember-resources';
    
    class MyDoubler {
        constructor(inputFn) { this.inputFn = inputFn; }
        
        get num() {
          return this.inputFn() * 2;
        }
        
        // not required, if you don't want
        destroy() {}
    }
    
    function Doubler(inputFn) {
      let state = new MyDoubler(inputFn);
      
      return resource(({ on, owner }) => {
        setOwner(state, owner);
        
        // not required if you don't want
        on.cleanup(() => state.destroy());
    
        return state;
      });
    }
    
    class Demo {
      @tracked something = 3;
        
      @use doubler = Doubler(() => this.something);
      
      get theValue() {
        return this.doubler.num; // 6
      }
    }
    ```

  </details>
  
- Other utilities moved to [https://reactive.nullvoxpopuli.com/](https://reactive.nullvoxpopuli.com/)
    - everything under `ember-resources/util`
    - `ember-resources/modifier`
    - `ember-resources/service`
    - `ember-resources/link`


Code is pretty much the same, so the migration is find and replace.

## 5.0

### tl;dr:

_Migration during the v4 series is available via different imports_.

**Upcoming breaking changes**

- No more `ember-concurrency@v1` support (though compatibility may still work)
- Removed exports:
  - `LifecycleResource`
  - constructor-oriented `Resource`
  - `@use` (re-implemented under a different import)
- Renamed utilities:
  - `useResource` => `Resource.from`
  - `useHelper` => `helper`
  - `useTask` => `task` with alias `trackedTask`
- Changed behavior:
  - `trackedFunction`
    - no longer receives the previous value
    - will return `null` instead of `undefined` before resolving
    - no longer holds on to the previous return value when re-running

**New features**

- opt-in svelte-able imports, but lazy tree-shakable imports still available (import everything from `'ember-resources'`)
- new `Resource` class with sole `modify` hook
- new `resource` function for function-based resources for simpler inline resources
  - For more information on this, see the [Docs on the Primitives](https://github.com/NullVoxPopuli/ember-resources/blob/main/DOCS.md)
- `trackedFunction` now provides additional state properties for better intermediate rendering during loading and error states
- new utilities / example resources
  - `Array.prototype.map` as a resource
  - `RemoteData` & `remoteData` - demonstrating composition of the function resource primitive and arg-based updating.
  - `debounce`


-----------------------------------

### Overview


Migrating to 5.0 requires some adjustments to how folks author Resources
 - `Resource` will be removed
 - `LifecycleResource` will be renamed to `Resource` and there will be a single `modify` hook
 - to opt-in to non-deprecated behaviors, there will be new import paths to use. Once 5.0 hits,
   the current top-level imports will re-export the classes and utilities from the new paths
   introduced in as a part of this migration effort (for convenience, totally optional)

For library authors wanting to implement these changes, they can _probably_ be done in a minor release,
as the reactivity and general APIs behave the same -- however, if there are any **potentially** breaking
changes in any of the APIs, they'll be called out below.


Primary goals of this migration:
- to align with the broader ecosystem -- specifically [ember-modifier](https://github.com/ember-modifier/ember-modifier), and simplifying class-based APIs
- provide a polyfill for resources for early [Polaris](sketch-polaris) designs,
  and adapt ideas from [Starbeam](docs-starbeam).
- improving semantics and nomenclature for resources, i.e.: not relying on other ecosystem's nomenclature for describing the utility APIs (e.g.: the `use*` prefix)
- provide an easy module-svelting approach for folks not yet using tree-shaking, but don't want every utility in the `ember-resources` package (i.e.: if you don't use it, you don't pay for it)

[sketch-polaris]: https://wycats.github.io/polaris-sketchwork/reactivity.html
[docs-starbeam]: https://starbeamjs.github.io/docs/

### Nomenclature changes

_`use*` (as a resource-name prefix) is dropped entirely_

The reason for this is that the "useThing" isn't descriptive of what behavior is actually happening.
In many cases, folks are using resources to mean "an object/function that participates in auto-tracking" and while
there _may_ be lifecycle-esque behaviors involved, depending on which implementation is in use, those are
ultimately an implementation detail for the specific resource's author.

Note that, or maybe as background,
_using a class that participates in autotracking_ may be as simple as adding something like this in your component:

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
models are at, without any extra noise -- this may be a provided API that _avoids_ `use` as a prefix.
```js
selectedBlogs = selection(this, { /* ... */ });
```

It's also reasonable to want use pascal case here as well -- even though we _may not_ explicitly be working with classes, we are constructing reactive data.
```js
selectedBlogs = Selection(this, { /* ... */ });
```

**Why "from"?**

`from` is also common nomenclature in JavaScript.
The usage in JavaScript that is most similar to the changse proposed for `ember-resources`
v5 (introduced in a v4 minor) is [`Array.from`][array-from] and [`TypedArray.from`][typed-array-from].

```js
selection = Selection.from(this, () => { /* ... */ })
```



[array-of]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/of
[for-of]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of
[for-await-of]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
[typed-array-of]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/of
[array-from]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
[object-fromEntries]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries
[typed-array-from]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/from

**Why omit any specifier?**

Consumers of your library do not need to and should not need to care about the specifics of how a `Resource`
is constructed.

For example, you're maybe providing a `Selection` Resource, a user will grok
`mySelection = selection(this, { /* ... */ })` much more easily than anything with additional words.
The omission of extra words is important, because it's less things to explain.
The lazy alternative may be `mySelection = Resource.of(this, Selection, () => { /* ... */ })`; multiple imports, a class, what's a Resource?, etc. Consumers of your library shouldn't need to know the specifics
of the implementation (the fact that resources are even a thing). However, in v5, because of the over-use of words, `.of` has been removed, and it's reasonable to have conusmers write `mySelection = Selection.from(this, () => { /* ... */ })`


### LifecycleResource

The `LifecycleResource` is no more, but there was great value in having a way to hook in to when args change.
The new `Resource` preserves that value, while simplifying the overall API of the class.

#### `args`

The new `modify()` lifecycle hook receives the positional and named arguments to the resource as its first and second parameters.
Previously, these were available as `this.args.positional` and `this.args.named` respectively,
and became available to use in that position after calling `super(owner, args)` in the constructor.
Now, the args are always available in the `modify()` hook directly.

This change helps alleviate issues with needing to compare previous/next args, due to how the args' containing object from the framework is the same between updates.

Before

```js
import { LifecycleResource } from 'ember-resources';

class MyResource extends LifecycleResource {
  get someNamedArg() {
    // No way to get previous?
    return this.args.named.someNamedArg;
  }
}
```

After
```js
import { Resource } from 'ember-resources';

class MyResource extends Resource {
  modify(positional, { someNamedArg }) {
    // Update local property only when the *value* differs.
    if (this.someNamedArg !== someNamedArg) {
      this.someNamedArg = someNamedArg;
    }
  }
}
```

The downside to this change is that resources cannot be _purely_ derived data drom arguments -- however,
they may re-gain that ability via setting a `@tracked` args object from within `modify`.
```js
import { Resource } from 'ember-resources';
import { tracked } from '@glimmer/component';

class Args {
  @tracked positional = [];
  @tracked named = {};
}

class MyResource extends Resource {
  args = new Args():

  modify(positional, named) {
    this.args.positional = positional;
    this.args.named = named;
  }
}
```

#### `setup()`

`modify()` is called on initial setup and subsequent updates. If what you need to do is cheap, you can let it happen each update.
If it is expensive, or if the operation is not [idempotent][idempotent], you can set a flag to avoid doing it again.

[idempotent]: https://en.wikipedia.org/wiki/Idempotence

Before
```js
import { LifecycleResource } from 'ember-resources';

class MyResource extends LifecycleResource {
  setup() {
    // do some expensive thing
  }
}
```

After
```js
import { Resource } from 'ember-resources';

class MyResource extends Resource {
  didSetup = false;

  modify() {
    if (!didSetup) {
      // do some expensive thing
    }
  }
}
```

#### `update()`

`modify()` is called on initial setup and subsequent updates. If what you need to do is cheap, you can let it happen each update.

Before
```js
import { LifecycleResource } from 'ember-resources';

class MyResource extends LifecycleResource {
  update() {
    // do some updating
    // this.args is always "current"
  }
}
```

After

```js
import { Resource } from 'ember-resources';

class MyResource extends Resource {
  modify(positional, named) {
    // do some updating

    if (this.old !== this.positional[0]) {
      // only do some update when a value changes
    }
  }
}
```


#### `teardown()`

Since ember-source@3.22, we no longer need to have teardown hooks implemented.
the [`@ember/destroyable`][e-destroyable] APIs allow us to consistently have
destruction / cleanup behavior on any class/object.

[e-destroyable]: https://api.emberjs.com/ember/release/modules/@ember%2Fdestroyable

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
import { Resource } from 'ember-resources';
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

Previously, the `Resource` crammed too much responsibility into the `constructor`,
which lead to some confusion aronud how to do the most basic of behaviors.
(This is a fault of the design, not the users).
Additionally, the old `Resource` had no way to have a final teardown.

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
import { Resource } from 'ember-resources';
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

Since the old `Resource` functioned much like a function,
the new `resource` primitive can provide what the original `Resource` was after: simplicity without ceramony.

```js
const myResource = ({ on }) => {
  // initial setup *and* updates

  on.cleanup(() => {
    // teardon
  });

  return /* the value */;
}
```

### Utilities

#### `useTask`

_in v5 `ember-concurrency@v1` will no longer be supported_. This does not mean that `ember-concurrency@v1`
won't work, but it does mean that maintenance in `ember-resources` regarding `ember-concurrency@v1`
is no longer worth the effort.

_ember-concurrency@v1 is also not compatible with ember-source@v4+_

#### `trackedFunction`

Starting in v4.6, a `trackedFunction` utility is available from a new import path,
`ember-resources/util/function`.

This version has additional properties for better managing intermediate state.
- `isResolved`
- `isPending`
- `isLoading`
- `isError`
- `value`
- `error`

#### `use`

The `@use` decorator did not see much of any public usage and will be removed in `ember-resources@v5`
from the `ember-resources` import path.

_however_ `@use` _is_ required for function-based resources (for various technical reasons described in the API docs).
This is a different use from the original `@use` -- this is mostly because the original `@use` did not see much of any public usage.
_this_ `@use` is re-exported from the `ember-resources` import path. If you haven't already migrated away from the _old_ `@use`, this `@use` will not be compatible.

#### `useFunction`

Already deprecated in favor of `trackedFunction`. Removed in v5.


#### `useHelper`

Renamed to `helper`, as per the nomenclature thoughts above.

Before

```js
import { tracked } from '@glimmer/tracking';
import { useHelper } from 'ember-resources';
import intersect from 'ember-composable-helpers/addon/helpers/intersect';

class Foo {
  @tracked listA = [1, 2, 3];
  @tracked listB = [3, 4, 5];

  myHelper = useHelper(this, intersect, () => [this.listA, this.listB])

  get intersection() {
    return this.myHelper.value;
  }
}
```
```hbs
{{log this.intersection}}
```

After

```js
import { tracked } from '@glimmer/tracking';
import { helper } from 'ember-resources/util/helper';
import intersect from 'ember-composable-helpers/addon/helpers/intersect';

class Foo {
  @tracked listA = [1, 2, 3];
  @tracked listB = [3, 4, 5];

  myHelper = helper(this, intersect, () => [this.listA, this.listB])

  get intersection() {
    return this.myHelper.value;
  }
}
```
```hbs
{{log this.intersection}}
```


#### `useResource`

Removed in favor of static method on `Resource`, `from`.
Additionally, the class no longer needs to be passed separately.

Before
```js
export function findAll(destroyable, modelName, thunk) {
  return useResource(destroyable, FindAll, () => {
    let reified = thunk?.() || {};
    let options = 'options' in reified ? reified.options : reified;

    return {
      positional: [modelName],
      named: {
        options,
      },
    };
  });
}
```

After
```js
export function findAll(destroyable, modelName, thunk) {
  return FindAll.from(destroyable, () => {
    let reified = thunk?.() || {};
    let options = 'options' in reified ? reified.options : reified;

    return {
      positional: [modelName],
      named: {
        options,
      },
    };
  });
}
```


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



