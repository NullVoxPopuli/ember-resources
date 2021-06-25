# ember-resources

An implementation of Resources in Ember.JS without decorators.
 - [More information on Resources](https://www.pzuraq.com/introducing-use/)
 - [Inspiration, ember-could-get-used-to-this](https://github.com/pzuraq/ember-could-get-used-to-this)


- [Installation](#installation)
- [Usage](#usage)
  - [useResource](#useresource)
  - [useTask](#usetask)
  - [LifecycleResource](#lifecycleresource)
  - [Functions](#function-resources)
  - [Thunks](#thunks)
- [Public Types](#public-types)
- [Testing](#testing)
- [Contributing](#contributing)
- [Thanks](#thanks)

## Compatibility

* Ember.js v3.25+
* TypeScript v4.2+

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

## Examples

```js
import { use, useFunction, useTask } from 'ember-resources';

class MyClass {
  data = useResource(this, DataClass, () => [arg list]);

  data1 = useFunction(this, () => { /* synchronous function */ })

  data2 = useFunction(this, async () => {}),

  data3 = useTask(this.someEmberConcurrencyTask, () => [optional arg list]);
}


```

## Usage


### `useResource`

`useResource` takes a `LifecycleResource` and an args thunk.

```ts
class MyClass {
  data = useResource(this, SomeResource, () => [arg list]);
}
```

When any tracked data in the args thunk, the `update` function on `SomeResource`
will be called.

 - The `this` is to keep track of destruction -- so when `MyClass` is destroyed, all the resources attached to it can also be destroyed.
 - The resource will **do nothing** until it is accessed.
 - For more info on Thunks, scroll to the bottom of the README

### `useTask`

This is a utility wrapper like `useResource`, but can be passed an ember-concurrency task
so that the ember-concurrency task can reactively be re-called whenever args change.
This largely eliminates the need to start concurrency tasks from the constructor, modifiers,
getters, etc.

A concurrency task accessed via `useTask` is only "ran" when accessed, and automatically updates
when it needs to.

```ts
class MyClass {
  myData = useTask(this, this._myTask, () => [args, to, task])

  @task
  *_myTask(args, to, task)  { /* ... */ }
}
```

Accessing `myData` will represent the last `TaskInstance`, so all the expected properties are available:
`value`, `isRunning`, `isFinished`, etc

### Making your own Resources with

#### `LifecycleResource`

This resource base class has 3 lifecycle hooks:
 - `setup` - called upon first access of the resource
 - `update` - called when any `tracked` used during `setup` changes
 - `teardown` - called when the containing context is torn down

An example of this might be an object that you want to have perform some
complex or async behavior

```ts
class MyResource extends LifecycleResource {
  @tracked isRunning;
  @tracked error;

  get status() {
    if (this.isRunning) return 'pending';
    if (this.error) return this.error;

    return 'idle';
  }

  setup() {
    this.doAsyncTask();
  }

  update() {
    this.doAsyncTask();
  }

  async doAsyncTask() {
    let [ids] = this.args.positional;

    this.isRunning = true;
    this.error = undefined;

    try {
      // some long running stuff here
    } catch (e) {
      this.error = e
    }

    this.isRunning = false;
  }
}
```

Using your custom Resource would look like
```ts
class ContainingClass {
  data = useResource(this, MyResource, () => [this.ids])
}
```

#### `function` Resources

While functions can be "stateless", Resources don't provide much value unless
you can have state. `function` Resources solve this by passing the previous
invocation's return value as an argument to the next time the function is called.

Example:
```ts
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

While this example is a bit contrived, hopefully it demonstrates how the `state` arg
works. During the first invocation, `state` is falsey, allowing the rest of the
function to execute. The next time `this.ids` changes, the function will be called
again, except `state` will be the `{ characters }` value during the first invocation,
and the function will return the initial data.

This particular technique could be used to run any async function _safely_ (as long
as the function doesn't interact with `this`).

In this example, where the function is `async`, the "value" of `info.value` is `undefined` until the
function completes.

If a function is synchronous, you can avoid the thunk altogether,

```ts
class MyClass {
  @tracked num = 3;

  info = useResource(this, () => {
    return this.num * 2;
  });
}
```

`this.info.value` will be `6`


### Thunks

With the exception of the `useResource` + `class` combination, all Thunks are optional.
The main caveat is that if you want your resource to update, you _must_ consume the tracked
properties during setup / initial execution.


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

## Testing

If your resources are consumed by components, you'll want to continue to
test using rendering tests, as things should "just work" with those style of
tests.

Where things get interesting is when you want to unit test your resources.

There are two approaches:

### `new` the resource directly

```ts
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

### Create a wrapper context for reactive consumption

If, instead of creating `MyResource` directly, like in the example above,
it is wrapped in a test class and utilizes `useResource`:
```ts
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

