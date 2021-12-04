# ember-resources

[![npm version](https://badge.fury.io/js/ember-resources.svg)](https://badge.fury.io/js/ember-resources)
[![CI](https://github.com/NullVoxPopuli/ember-resources/actions/workflows/ci.yml/badge.svg?branch=main&event=push)](https://github.com/NullVoxPopuli/ember-resources/actions/workflows/ci.yml)

An implementation of Resources in Ember.JS without decorators.
 - [More information on Resources](https://www.pzuraq.com/introducing-use/)
 - [Inspiration, ember-could-get-used-to-this](https://github.com/pzuraq/ember-could-get-used-to-this)

_This is a [V2-format Addon](https://github.com/emberjs/rfcs/pull/507) with V1 compatibility_

- [Installation](#installation)
- [Usage](#usage)
  - [useResource](#useresource)
  - [useTask](#usetask)
  - [Resource](#resource)
  - [LifecycleResource](#lifecycleresource)
  - [Functions](#function-resources)
  - [Thunks](#thunks)
  - [Composition](#composition)
- [Public Types](#public-types)
- [Testing](#testing)
- [Contributing](#contributing)
- [Thanks](#thanks)

## Compatibility

* ember-source v3.25+
* typeScript v4.2+
* ember-auto-import v2+

_NOTE_: if you are also using ember-could-get-used-to-this, `@use` is not compatible with
this library's `LifecycleResource`, and `useResource` does not work with ember-could-get-used-to-this' `Resource`.
However, both libraries can still be used in the same project.

## Installation

```bash
npm install ember-resources
# or
yarn add ember-resources
# or
ember install ember-resources
```

## Example

```js
import { useFunction } from 'ember-resources';

class MyClass {
  data = useFunction(this, async () => {
    let response = await fetch('...');
    let json = await response.json();
    return json;
  }),
}
```
```hbs
{{this.data.value}}
```

## Usage

### `useResource`

`useResource` takes either a `Resource` or `LifecycleResource` and an args thunk.

```ts
import { useResource } from 'ember-resources';

class MyClass {
  data = useResource(this, SomeResource, () => [arg list]);
}
```

When any tracked data in the args thunk is updated, the Resource will be updated as well

 - The `this` is to keep track of destruction -- so when `MyClass` is destroyed, all the resources attached to it can also be destroyed.
 - The resource will **do nothing** until it is accessed. Meaning, if you have a template that guards
   access to the data, like:
   ```hbs
   {{#if this.isModalShowing}}
      <Modal>{{this.data.someProperty}}</Modal>
   {{/if}}
   ```
   the Resource will not be instantiated until `isModalShowing` is true.

 - For more info on Thunks, scroll to the bottom of the README

### `useTask`

This is a utility wrapper like `useResource`, but can be passed an ember-concurrency task
so that the ember-concurrency task can reactively be re-called whenever args change.
This largely eliminates the need to start concurrency tasks from the constructor, modifiers,
getters, etc.

A concurrency task accessed via `useTask` is only invoked when accessed, and automatically updates
when it needs to.

```ts
import { useTask } from 'ember-resources';

class MyClass {
  myData = useTask(this, this._myTask, () => [args, to, task])

  @task
  *_myTask(args, to, task)  { /* ... */ }
}
```

Accessing `this.myData` will represent the last `TaskInstance`, so all the expected properties are available:
`value`, `isRunning`, `isFinished`, etc.
See: the [TaskInstance](http://ember-concurrency.com/api/TaskInstance.html) docs for more info.

_NOTE: `ember-resources` does not have a dependency on ember-concurrency_

### Making your own Resources with

#### `Resource`

Resources extending this base class have no lifecycle hooks to encourage data-derivation (via getters) and
generally simpler state-management than you'd otherwise see with the typical lifecycle-hook-aware Resource.

For example, this is how you'd handle initial setup, updates, and teardown with a `Resource`

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
This works much like `useFunction`, in that the previous instance is passed to the next instance and there
is no overall persisting instance of `MyResource` as the `args` update. This technique eliminates the need
to worry about if your methods, properties, and getters might conflict with the base class's API, which is
a common complaint among the anti-class folks.

Many times, however, you may not even need to worry about destruction, which is partially what makes opting
in to having a "destructor" so fun -- you get to choose how much lifecycle your `Resource` has.

More info: [`@ember/destroyable`](https://api.emberjs.com/ember/release/modules/@ember%2Fdestroyable)

**So why even have a class at all?**

You may still want to manage state internal to your resource, such as if you were implementing a
"bulk selection" resource for use in tabular data. This hypothetical resource may track its own
partial / all / none selected state. If the args to this resource change, you get to decide if you
want to reset the state, or pass it on to the next instance of the selection resource.

```js
import { Resource } from 'ember-resources';

class Selection extends Resource {
  @tracked state = NONE; /* or SOME, ALL, ALL_EXCEPT */

  constructor(owner, args, previous) {
    super(owner, args, previous);

    let { filterQueryString } = args.named;

    if (previous && previous.args.named.filterQueryString !== filterQueryString) {
      // reset the state when the consumer has changed which records we care about.
      this.state = NONE;
    }
  }

  @action selectAll() { this.state = ALL; }
  @action deselectAll() { this.state = NONE; }
  @action toggleItem(item) { /* ... */ }
  // etc
}
```
usage of this Resource could look like this:
```js
// in either a component or route:
export default class MyComponent extends Component {
  @service router;

  get filter() {
    return this.router.currentRouter.queryParams.filter;
  }

  // implementation omitted for brevity -- could be passed to EmberTable or similar
  records = useResource(this, EmberDataQuery, () => ({ filter: this.filter }));

  // the `this.selection.state` property is re-set to NONE when `this.filter` changes
  selection = useResource(this, Selection, () => ({ filterQueryString: this.filter }))
}
```

For library authors, it may be a kindness to consumers of your library to wrap the `useResource`
call so that they only need to manage one import -- for example:

```js
// addon/index.js

// @private
import { Selection } from './wherever/it/is.js';

// @public
export function useSelection(destroyable, thunk) {
  return useResource(destroyable, Selection, thunk);
}
```

Another example of interacting with previous state may be a "load more" style data loader / pagination:

```js
import { Resource } from 'ember-resources';
import { isDestroyed, isDestroying } from '@ember/destroyable';

class DataLoader extends Resource {
  constructor(owner, args, previous) {
    super(owner, args, previous);

    this.results = previous?.results;

    let { url, offset } = this.args.named;

    fetch(`${url}?offset=${offset}`)
      .then(response => response.json())
      .then(results => {
        if (isDestroyed(this) || isDestroying(this)) return;

        this.results = this.results.concat(result);
    });
  }
}
```
consumption of the above resource:
```js
import { useResource } from 'ember-resources';

class MyComponent extends Component {
  @tracked offset = 0;

  data = useResource(this, DataLoader, () => ({ url: '...', offset: this.offset }));

  // when a button is clicked, load the next 50 records
  @action loadMore() { this.offset += 50; }
}
```


#### `LifecycleResource`

When possible, you'll want to favor `Resource` over `LifecycleResource` as `Resource` is simpler.

They key differences are that the `LifecycleResource` base class has 3 lifecycle hooks
 - `setup` - called upon first access of the resource
 - `update` - called when any `tracked` used during `setup` changes
 - `teardown` - called when the containing context is torn down

The main advantage to the `LifecycleResource` is that the teardown hook is for "last teardown",
whereas with `Resource`, if a destructor is registered in the destructor, there is no way to know
if that destruction is the final destruction.


An example of when you'd want to reach for the `LifecycleResource` is when you're managing external long-lived
state that needs a final destruction call, such as with XState, which requires that the "State machine interpreter"
is stopped when you are discarding the parent context (such as a component).

An example
```js
import { LifecycleResource } from 'ember-resources';
import { createMachine, interpret } from 'xstate';

const machine = createMachine(/* ... see XState docs for this function this ... */);

class MyResource extends LifecycleResource {
  @tracked state;

  setup() {
    this.interpreter = interpret(machine).onTransition(state => this.state = state);
  }

  update() {
    this.interpreter.send('ARGS_UPDATED', this.args);
  }

  teardown() {
    this.interpreter.stop();
  }
}
```

Using this Resource is the exact same as `Resource`
```ts
import { useResource } from 'ember-resources';

class ContainingClass {
  state = useResource(this, MyResource, () => [...])
}
```

There _is_ however a semi-unintuitive technique you could use to continue to use `Resource` for the `final` teardown:

```js
import { Resource } from 'ember-resources';
import { registerDestructor, unregisterDestructior } from '@ember/destroyable';

class MyResource extends Resource {
  constructor(owner, args, previous) {
    super(owner, args, previous);

    registerDestructor(this, this.myFinalCleanup);

    if (previous) {
      // prevent destruction
      unregisterDestructor(prev, prev.myFinalCleanup);
    } else {
      // setup
    }
  }

  @action myFinalCleanup() { /* ... */ }
}
```

#### `function` Resources

While functions can be "stateless", Resources don't provide much value unless
you can have state. `function` Resources solve this by passing the previous
invocation's return value as an argument to the next time the function is called.

In addition to that state, all function resources inherently track async state for you
so you can use plain functions, async or not, in your derived data patterns in you apps
and libraries.

There are two flavors of function resources
 - `trackedFunction`
 - `useFunction`

##### `trackedFunction`

This is the simpler of the two function resources, where

Any tracked data accessed in a tracked function _before_ an `await`
will "entangle" with the function -- we can call these accessed tracked
properties, the "tracked prelude". If any properties within the tracked
payload  change, the function will re-run.

```js
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { trackedFunction }  from 'ember-resources';

class Demo extends Component {
  @tracked id = 1;

  request = trackedFunction(this, async () => {
    let response = await fetch(`https://swapi.dev/api/people/${this.id}`);
    let data = await response.json();

    return data; // { name: 'Luke Skywalker', ... }
  });

  updateId = (event) => this.id = event.target.value;

  // Renders "Luke Skywalker"
  <template>
    {{this.request.value.name}}

    <input value={{this.id}} {{on 'input' this.updateId}}>
  </template>
}
```
_Note_, this example uses the proposed `<template>` syntax from the [First-Class Component Templates RFC][rfc-799]

[rfc-799]: https://github.com/emberjs/rfcs/pull/779


##### `useFunction`


Example:
```ts
import { useFunction } from 'ember-resources';

class StarWarsInfo {
  // access result on info.value
  info = useFunction(this, async (state, ...args) => {
    if (state) {
      let { characters } = state;

      return { characters };
    }

    let [ids] = args;
    let response = await fetch(`/characters/${ids}`) ;
    let characters = await response.json();

    return { characters };
  }, () => [this.ids /* defined somewhere */])
}
```
> `characters` would be accessed via `this.info.value.characters` in the `StarWarsInfo` class

While this example is a bit contrived, hopefully it demonstrates how the `state` arg
works. During the first invocation, `state` is falsey, allowing the rest of the
function to execute. The next time `this.ids` changes, the function will be called
again, except `state` will be the `{ characters }` value during the first invocation,
and the function will return the initial data.

This particular technique could be used to run any async function _safely_ (as long
as the function doesn't interact with `this`).

In this example, where the function is `async`, the "value" of `info.value` is `undefined` until the
function completes.

To help prevent accidental async footguns, even if a function is synchronous, it is still ran
asynchronously, therefor, the thunk cannot be avoided.

```ts
import { useFunction } from 'ember-resources';

class MyClass {
  @tracked num = 3;

  info = useFunction(this, () => {
    return this.num * 2;
  });
}
```

`this.info.value` will be  `undefined`, then `6` and will not change when `num` changes.


### Thunks

With the exception of the `useResource` + `class` combination, all Thunks are optional.
The main caveat is that if your resources will not update without a thunk -- or consuming
tracked data within setup / initialization (which is done for you with `useFunction`).


 - The thunk is "just a function" that allows tracked data to be lazily consumed by the resource.

The args thunk accepts the following data shapes:
```
() => [an, array]
() => ({ hello: 'there' })
() => ({ named: {...}, positional: [...] })
```

#### An array

when an array is passed, inside the Resource, `this.args.named` will be empty
and `this.args.positional` will contain the result of the thunk.

_for function resources, this is the only type of thunk allowed._

#### An object of named args

when an object is passed where the key `named` is not present,
`this.args.named` will contain the result of the thunk and `this.args.positional`
will be empty.

#### An object containing both named args and positional args

when an object is passed containing either keys: `named` or `positional`:
 - `this.args.named` will be the value of the result of the thunk's `named` property
 - `this.args.positional` will be the value of the result of the thunk's `positional` property

This is the same shape of args used throughout Ember's Helpers, Modifiers, etc

### Composition

These patterns are primarily unexplored so if you run in to any issues,
please [open a bug report / issue](https://github.com/NullVoxPopuli/ember-resources/issues/new).

Composing class-based resources is expected to "just work", as classes maintain their own state.

#### useFunction + useFunction

```js
import Component from '@glimmer/component';
import { useFunction } from 'ember-resources';

class MyComponent extends Component {
  rand = useFunction(this, () => {
    return useFunction(this, () => Math.random());
  });
}
```
Accessing the result of `Math.random()` would be done via:
```hbs
{{this.rand.value.value}}
```

Something to note about composing resources is that if arguments passed to the
outer resource change, the inner resources are discarded entirely.

For example, you'll need to manage the inner resource's cache invalidation yourself if you want
the inner resource's behavior to be reactive based on outer arguments:

<details><summary>Example data fetching composed functions</summary>

```js
import Component from '@glimmer/component';
import { useFunction } from 'ember-resources';

class MyComponent extends Component {
  @tracked id = 1;
  @tracked storeName = 'blogs';

  records = useFunction(this, (state, storeName) => {
      let result: Array<string | undefined> = [];

      if (state?.previous?.storeName === storeName) {
        return state.previous.innerFunction;
      }

      let innerFunction = useFunction(this, (prev, id) => {
        // pretend we fetched a record using the store service
        let newValue = `record:${storeName}-${id}`;

        result = [...(prev || []), newValue];

        return result;
        },
        () => [this.id]
      );

      return new Proxy(innerFunction, {
        get(target, key, receiver) {
          if (key === 'previous') {
            return {
              innerFunction,
              storeName,
            };
          }

          return Reflect.get(target, key, receiver);
        },
      });
    },
    () => [this.storeName]
  );
}
```
```hbs
{{this.records.value.value}} -- an array of "records"
```


</details>




## Public Types

```ts
import type { ArgsWrapper, Named, Positional } from 'ember-resources';
```

where:

### ArgsWrapper
```ts
interface ArgsWrapper {
  positional?: unknown[];
  named?: Record<string, unknown>;
}
```
this is a utility interface that represents all of the args used throughout
Ember.

Example
```ts
class MyResource extends LifecycleResource { // default args type
  constructor(owner: unknown, args: ArgsWrapper) {
    super(owner, args);
  }
}
```


### Shorthand for positional only
```ts
export interface Positional<T extends Array<unknown>> {
  positional: T;
}
```

Example:

```ts
class MyResource extends LifecycleResource<Positional<[number]>> {
}
```

### Shorthand for named only
```ts
export interface Named<T extends Record<string, unknown>> {
  named: T;
}
```

Example:

```ts
class MyResource extends LifecycleResource<Named<{ bananas: number }>> {
}
```

These shorthands are 3 characters sharter than using the `named:` or
`positional: ` keys that would be required if not using these shorthands...


## Testing

If your resources are consumed by components, you'll want to continue to
test using rendering tests, as things should "just work" with those style of
tests.

Where things get interesting is when you want to unit test your resources.

There are two approaches:

### `new` the resource directly

```ts
import { LifecycleResource } from 'ember-resources';

test('my test', function(assert) {
  class MyResource extends LifecycleResource {
    // ...
  }

  let instance = new MyResource(this.owner, { /* args wrapper */ });

  // assertions with instance
})
```

The caveat here is that the `setup` and `update` functions will have to
be called manually, because we aren't using `useResource`, which wraps the
Ember-builtin `invokeHelper`, which takes care of reactivity for us. As a
consequence, any changes to the args wrapper will not cause updates to
the resource instance.

For the `Resource` base class, there is a static helper method which helps simulate
the `update` behavior.

```js
import { Resource } from 'ember-resources';

test ('my test', function (assert) {
  class MyResource extends Resource {
    // ...
  }

  let instance = new MyResource(this.owner, { /* args wrapper */ });

  let nextInstance = MyResource.next(instance, { /* args wrapper */ });
});
```

`Resource.next`, however, does not destroy the instance. For that, you'll want to use
`destroy` from `@ember/destroyable`.

```js
import { destroy } from '@ember/destroyable';

// ...

destroy(instance);
```


### Create a wrapper context for reactive consumption

If, instead of creating `MyResource` directly, like in the example above,
it is wrapped in a test class and utilizes `useResource`:
```ts
import { useResource } from 'ember-resources';

class TestContext {
  data = useResource(this, MyResource, () => { ... })
}
```
changes to args _will_ trigger calls to `setup` and `update`.

NOTE: like with all reactivity testing in JS, it's important to
`await settled()` after a change to a reactive property so that you allow
time for the framework to propagate changes to all the reactive bits.

Example:

```ts
import { LifecycleResource, useResource } from 'ember-resources';

test('my test', async function (assert) {
  class Doubler extends LifecycleResource<{ positional: [number] }> {
    get num() {
      return this.args.positional[0] * 2;
    }
  }

  class Test {
    @tracked count = 0;

    data = useResource(this, Doubler, () => [this.count]);
  }

  let foo = new Test();

  assert.equal(foo.data.num, 0);

  foo.count = 3;
  await settled();

  assert.equal(foo.data.num, 6);
```

## Related addons

List of addons that use and wrap `ember-resources` to provide more specific functionality:

- [ember-data-resources](https://github.com/NullVoxPopuli/ember-data-resources) - resources for reactive data fetching with ember-data
- [ember-array-map-resource](https://github.com/NullVoxPopuli/ember-array-map-resource) - provides a useArrayMap function which returns a resource that reactively maps data per-element, so that when the overall collection is dirtied, only the changed/new/removed elements affect the mapped collection

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.


## License

This project is licensed under the [MIT License](LICENSE.md).


## Thanks

This library wouldn't be possible without the work of:
 - [@pzuraq](https://github.com/pzuraq)
 - [@josemarluedke](https://github.com/josemarluedke)

So much appreciate for the work both you have put in to Resources <3

