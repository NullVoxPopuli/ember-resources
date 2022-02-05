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
