# ember-resources

[![npm version](https://badge.fury.io/js/ember-resources.svg)](https://badge.fury.io/js/ember-resources)
[![CI](https://github.com/NullVoxPopuli/ember-resources/actions/workflows/ci.yml/badge.svg?branch=main&event=push)](https://github.com/NullVoxPopuli/ember-resources/actions/workflows/ci.yml)

An implementation of Resources in Ember.JS without decorators.
 - [More information on Resources](https://www.pzuraq.com/introducing-use/)
 - [Inspiration, ember-could-get-used-to-this](https://github.com/pzuraq/ember-could-get-used-to-this)

_This is a [V2-format Addon](https://github.com/emberjs/rfcs/pull/507) with V1 compatibility_

- [Installation](#installation)
- [What is a Resource?](#what-is-a-resource)
  - [By Example](#by-example)
- [Usage](#api-and-usage)
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
import { trackedFunction } from 'ember-resources';

class MyClass {
  @tracked endpoint = 'starships';

  data = trackedFunction(this, async () => {
    let response = await fetch(`https://swapi.dev/api/${this.endpoint}`);
    let json = await response.json();

    return json.results;
  }),

  get records() {
    return this.data.value ?? [];
  }
}
```
```hbs
{{this.records}}
```

In this example, `trackedFunction` will make a call to [StarWars API](https://swapi.dev/)
and if `endpoint` changes from `starships` to `planets`, the `trackedFunction` will
automatically re-call the StarWars API to fetch the planets.

## Related addons

List of addons that use and wrap `ember-resources` to provide more specific functionality:

- [ember-data-resources](https://github.com/NullVoxPopuli/ember-data-resources) - resources for reactive data fetching with ember-data
- [ember-array-map-resource](https://github.com/NullVoxPopuli/ember-array-map-resource) - provides a useArrayMap function which returns a resource that reactively maps data per-element, so that when the overall collection is dirtied, only the changed/new/removed elements affect the mapped collection
- [ember-use-sound](https://github.com/chrismllr/ember-use-sound) - a resource for interacting with audio files

## What is a Resource?

> They are most similar to class-based Ember helpers, but with a more targeted goal overall. Resources are meant to bridge a gap between imperative programming and declarative programming.
>
> Ember templates are declarative. When we design a component, like the profile component from our previous example, we are specifying declaratively the HTML that should be rendered. If the data used in the templates ever updates, then Ember will update the rendered output as well, and we don't have to worry about the details. We don't have to tell Ember which specific steps to take, and when - it figures everything out for us.

<div style="width: 100%; text-align: right;">
  <cite>pzuraq on "<em>Introducing @use</em>"</cite>
</div>

So.. _what_ is a Resource, really?

A _Resource_ is a behavior that can be used in both templates and javascript.

### In JavaScript

A Resource is an alternate API for
```js
import { cached } from '@glimmer/tracking';

class A {
  @cached
  get myResource() {
    return new MyResource(this.args.foo)
  }
}
```
In this example, `myResource` returns an instance of a class and will re-create that
class if `@foo` changes. That class can have its own internal state.

### In Templates

A Resource is a stateful helper:
```hbs
{{#let (my-resource @foo) as |myResource|}}
  {{!-- ... --}}
{{/let}}
```
In this example, `my-resource` returns an instance of a class and will re-create that
class if `@foo` changes. That class can have its own internal state and is available
for use via the local variable `myResource`.

### By example

Throughout all of these examples, you may notice that some _can be_ a bit of work,
maybe more suited towards libraries, rather than end-user app code.
It's still good to know the problem space, because when your developing an app, you
may not have the time to create a library so that your app's code is minimal.

#### How do you deal with async data?

Async data is a common problem in user interfaces.
In Ember, it's standard practice to load _minimally required_
data in a route, and any secondary or supplementary data in components.

For more information on thinking about async data,
_[Async data and autotracking in ember octane](https://v5.chriskrycho.com/journal/async-data-and-autotracking-in-ember-octane/)
by Chris Krycho_ may be of interest.

For example, if you wanted to lazily and reactively load data based on
an `@argument` passed to a component

<details><summary>In vanilla Ember, no addons</summary>

Since Octane, Ember has had no ergonomic way to deal with loading
data in components.  The most effective way to implement your own
data loading pattern is to use custom [Helpers](https://api.emberjs.com/ember/release/classes/Helper).

```js
// app/helpers/load-records.js
import Helper from '@ember/component/helper';
import { isDestroyed, isDestroying } from '@ember/destroyable';
import { tracked } from '@glimmer/tracking';

export default class LoadRecords extends Helper {
  @tracked value;

  get records() {
    return this.value ?? [];
  }

  // Cache is needed so we don't cause an infinite loop
  // - call helper
  // - helper "entangles" with tracked data (this.records -> this.value)
  // - this.value changes
  // - helper is re-invoked
  // - repeat
  //
  // The cache prevents re-requesting then this.value is set
  cache = new Map();

  compute([endpoint]) {
    this.makeRequest(endpoint);

    return this.records;
  }

  async makeRequest(endpoint) {
    if (this.cache.has(endpoint)) {
      // We have to await Promise.resolve() here
      // to disconnect reactivity from the helper, otherwise
      // we get an infinite rendering / revalidation assertion
      await Promise.resolve();

      let existing = this.cache.get(endpoint);

      // Don't set the value if we don't need to
      if (this.value && this.value === existing) {
        return;
      }

      this.value = existing;
    }

    let results = await get(`https://swapi.dev/api/${endpoint}`);

    // Destruction protection, as we can't assign values to destroyed objects
    // below (this.value = ...)
    if (isDestroyed(this) || isDestroying(this)) return;

    // If there is accidentally a second request running
    // simultaneously, we don't want to re-invalidate the cache
    if (this.cache.has(endpoint)) {
      return;
    }

    this.value = results;
    this.cache.set(endpoint, results);
  }
}

async function get(endpoint) {
  let response = await fetch(`https://swapi.dev/api/${endpoint}`);
  let json = await response.json();

  return json.results;
}
```
and then once your helper exists, usage would like the following:
```hbs
{{!-- endpoint is a string, "starships", "planets", etc --}}
{{#let (load-records @endpoint) as |records|}}
  {{#each records as |record|}}
    {{record.name}}<br>
  {{/each}}
{{/let}}
```

A few downsides with this approach:
- The helper is disconnected from the component that needs the behavior.
- The helper is globally resolveable and bleeds into other areas of the apps,
  preventing other similar behaviors from being implemented.
- It's non-obvious where helpers come from. Addons? App?
- A helper can _only_ be used within templates and can't be re-used in JavaScript.
- Lots of behavioral edge cases to deal with manually.
- Stale data problems when the `@endpoint` variable toggles between values.

Note that this is _without_ `@cached`, which landed in `ember-source` in 4.1.
Prior to 4.1 using `@cached` requires a [polyfill](https://github.com/ember-polyfills/ember-cached-decorator-polyfill).

</details>

<details><summary>With the `@cached` decorator</summary>

`@cached` landed in `ember-source` 4.1, and to use the decorator pre-4.1, you'll
need to install the [polyfill](https://github.com/ember-polyfills/ember-cached-decorator-polyfill).


With `@cached`, you now have two options:
 - continue with the helper approach above (but using `@cached` to help simplify things)
 - or move the logic to the component, which solves

This example will move the logic to the component, because eliminating the helper
also eliminates a few of the downsides mentioned in the previous example.

For re-use, this could be extracted to a _provider_ component.

```js
// app/components/load-records.js
import Component from '@glimmer/component';
import { cached, tracked } from '@glimmer/tracking';

export default class LoadRecords extends Component {
  // the @cached decorator here is required so that repeat
  // accesses to either request or records do not unnecessarily
  // create a new TrackedRequest for the same @endpoint
  @cached
  get request() {
    // A new TrackedRequest is created when @endpoint changes
    let trackedRequest = new TrackedRequest(this.args.endpoint);

    return trackedRequest;
  }

  get records() {
    return this.request.results ?? [];
  }
}

class TrackedRequest {
  @tracked results;
  @tracked error;

  constructor(endpoint) {
    get(endpoint)
      .then((results) => (this.results = results))
      .catch((error) => (this.error = error));
  }
}

async function get(endpoint) {
  let response = await fetch(`https://swapi.dev/api/${endpoint}`);
  let json = await response.json();

  return json.results;
}
```
```hbs
{{!-- app/components/load-records.hbs --}}
{{#each this.records as |record|}}
  {{record.name}}<br>
{{/each}}
```
and usage of this component would look like:
```hbs
<LoadRecords @endpoint="starships" />
```

This is a huge improvement over the previous example, but still has downsides:
 - You have to manage state of the request yourself
 - Still feels like a lot of ceremony for something that _"should be easy"_.
 - While `TrackedRequest` can be used in JavaScript, requiring a `@cached` getter
   to use it also feels like too much ceremony.

</details>

<details><summary>With Resources</summary>

This example uses `trackedFunction`, a light API wrapping a plain `Resource`.

```js
// app/components/load-records.js
import Component from '@glimmer/component';
import { trackedFunction } from 'ember-resources';

export default class LoadRecords extends Component {
  request = trackedFunction(this, async () => {
    let response = await fetch(`https://swapi.dev/api/${this.args.endpoint}`);
    let json = await response.json();

    return json.results;
  }),

  get records() {
    return this.request.value ?? [];
  }
}
```
```hbs
{{!-- app/components/load-records.hbs --}}
{{#each this.records as |record|}}
  {{record.name}}<br>
{{/each}}
```

</details>

### Web Permissions

TODO

### Selection

This example, non-async,

internal state management.

Could be written as

```js
@cached
get selection() {
  return new Selection(/* initial args here */)
}
```

## API and Usage

### `@use`

The `@use` decorator abstractions away the underlying reactivity configuration
needed to use a Resource. `@use` can work with `Resource` or `LifecycleResource`.

```js
class MyClass {
  @use data = SomeResource.with(() => [arg list]);
}
```

All subclasses of `Resource` and `LifecycleResource` have a static method, `with`.
This `with` method takes the same argument Thunk you'll see throughout other usages
of Resources in this document.

The `type` of `data` in this example will be an instance of `SomeResource`, so that
typescript is happy / correct.

### `useResource`

`useResource` takes either a `Resource` or `LifecycleResource` and an args thunk.

`useResource` is what allows _Resources_ to be used in JS, they hide the reactivity APIs
from the consumer so that the surface API is smaller. Though, from an end-user-api
ergonomics perspective, you wouldn't typically want to rely on this. As in
[ember-data-resources](https://github.com/NullVoxPopuli/ember-data-resources/)
the useResource + Resource class are coupled together in to more meaningful APIs --
allowing only a single import in most cases.

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

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.


## License

This project is licensed under the [MIT License](LICENSE.md).


## Thanks

This library wouldn't be possible without the work of:
 - [@pzuraq](https://github.com/pzuraq)
 - [@josemarluedke](https://github.com/josemarluedke)

So much appreciate for the work both you have put in to Resources <3

