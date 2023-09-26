---
"ember-resources": minor
---

Omit thunk arg for class based resources when not needed

When using a `Resource` but not using arguments with reactive parameters, initializing them still required the usage of a thunk, ie:

```ts
class TestResource extends Resource {
  foo = 3;
}

class Test {
  data = TestResource.from(this, () => []);
}
```

... for basically, no reason. This change makes thunks a non-required parameter, leading into cleaner code like so:

```ts
class TestResource extends Resource {
  foo = 3;
}

class Test {
  data = TestResource.from(this);
}
```
