---
"ember-resources": major
---

`trackedFunction` has a new API and thus a major version release is required.

_Work by [@lolmaus](https://github.com/lolmaus)_

tl;dr: the breaking changes:

- no more manual initial value
- `isResolved` is only true on success

other changes:

- `trackedFunction` is a wrapper around `ember-async-data`'s [`TrackedAsyncData`](https://github.com/tracked-tools/ember-async-data/blob/main/ember-async-data/src/tracked-async-data.ts)
- behavior is otherwise the same

NOTE: `trackedFunction` is an example utility of how to use auto-tracking with function invocation,
and abstract away the various states involved with async behavior. Now that the heavy lifting is done by `ember-async-data`,
`trackedFunction` is now more of an example of how to integrated existing tracked utilities in to resources.

---

**Migration**

**_Previously_**, the state's `isResolved` property on `trackedFunction` was `true` on both success and error.

_now_, `isFinished` can be used instead. 
`isResolved` is now only true when the function runs to completion without error, aligning with the semantics of promises.


**_Previously_, `trackedFunction` could take an initial value for its second argument.**

```js
class Demo {
  foo = trackedFunction(this, "initial value", async () => {
    /* ... */
  });
}
```

This has been removed, as initial value can be better maintained _and made more explicit_
in user-space. For example:

```js
class Demo {
  foo = trackedFunction(this, async () => {
    /* ... */
  });

  get value() {
    return this.foo.value ?? "initial value";
  }
}
```

Or, in a template:

```hbs
{{#if this.foo.value}}
  {{this.foo.value}}
{{else}}
  initial displayed content
{{/if}}
```

Or, in gjs/strict mode:

```gjs
const withDefault = (value) => value ?? 'initial value';

class Demo extends Component {
  foo = trackedFunction(this, async () => { /* ... */ });

  <template>
    {{withDefault this.foo.value}}
  </template>
}
```

**_Previously_, the `isResolved` property was `true` for succesful and error states**

Now, `isResolved` is only true when the function passed to `trackedFunction` has succesfully
completed.

To have behavior similar to the old behavior, you may want to implement your own `isFinished` getter:

```js
class Demo {
  foo = trackedFunction(this, async () => {
    /* ... */
  });

  get isFinished() {
    return this.foo.isResolved || this.foo.isRejected;
  }
}
```
