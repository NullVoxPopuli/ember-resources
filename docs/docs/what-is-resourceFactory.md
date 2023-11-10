# What is `resourceFactory`?

## Why do we need it?

`resourceFactory` provides a compatibility with the design goal of resources given the current limitations of public APIs in Ember. The idea is that we'd eventually get rid of it, and even right now, it's basically a no-op.

<details><summary>What will removing resourceFactory look like?</summary>

This will be automated via codemod in the future, so its best to not worry about the details here, but for the curious:

Since `resourceFactory` is almost no-op function, you would delete it, like this:
```diff
  function LocalizedClock(locale) {
      return resource(() => {
          /* ... */
          return 'theValue';
      });
  }

- resourceFactory(LocalizedClock);
```

Or if you have code that more aggressively wrapped the function with `resourceFactory`, your change would look like this:

```diff
- const LocalizedClock = resourceFactory((locale) => {
+ function LocalizedClock(locale) {
      return resource(() => {
          /* ... */
          return 'theValue';
      });
- });
+ }
```


</details>

The behavior that we _want_ when we define a resource like this:
```js 
function LocalizedClock(locale) {
    return resource(() => {
        /* ... */
        return 'theValue';
    });
}
```
and invoke it like this:
```hbs 
{{LocalizedClock 'en-US'}}
```

We want, not only the function, `LocalizedClock` to be invoked, but also the `resource`.

One way to think about this is to strip away all the resource-isms and you're left with:
```js 
function localizedClock(locale) {
    return function myInnerFunction() {
        return 'theValue';
    }
}
```
this would still be invoked via:
```hbs 
{{localizedClock 'en-US'}}
```
but we can more easily see that the return value is a function.

So, like with `LocalizedClock`, we have to do this for `localizedClock`:
```hbs
{{#let (localizedClock 'en-US') as |innerFunction|}}

    {{ (innerFunction) }} -- prints theValue

{{/let}}

{{#let (LocalizedClock 'en-US') as |theResource|}}

    {{ (theResource) }} -- prints theValue

{{/let}}
```

We don't want to have to use `let` for each time we want to use a resource, so that's what `resourceFactory` helps out with.

`resourceFactory` _immediately_ invokes that returned function.
It's a side-effecting API, so it can be used like this:

```js 
function LocalizedClock(locale) {
    return resource(() => {
        /* ... */
        return 'theValue';
    });
}

resourceFactory(LocalizedClock);
```

which then allows for:
```hbs 
{{LocalizedClock 'en-US'}} -- prints theValue
```


## What is it it?

This is the [implementation](https://github.com/NullVoxPopuli/ember-resources/blob/2608052dcb740223ad83aef679f4406328894669/ember-resources/src/core/function-based/immediate-invocation.ts#L132):
```js
export function resourceFactory(wrapperFn) {
  setHelperManager(ResourceInvokerFactory, wrapperFn);

  return wrapperFn; 
}
```

It's _almost_ an "identity function", i.e: `x => x`.

Docs:

- [`setHelperManager`](https://api.emberjs.com/ember/release/functions/@ember%2Fhelper/setHelperManager)

## Can I _not_ use it?

Yes, if you are reasonbly certain that your Resource doesn't need to directly be invoked in templates 


For example:

```js 
import Component from '@glimmer/component';
import { use, resource } from 'ember-resources';

function LocalizedClock(locale) {
    return resource(() => {
        /* ... */
        return 'theValue';
    });
}

export default class Demo extends Component {
    @use data = LocalizedClock('en-US');

    <template>
        {{this.data}} -- prints 'theValue'
    </template>
}

```

Calling `LocalizedClock` is _just a function call_ -- in JavaScript, there is nothing special between "resources with arguments" vs "functions that return functions", as they could be thought of as the same.

However, in JavaScript, and like with all reactive systems, you must manage reactivity yourself. In the template, we're used to this being automatic, but in JavaScript, if you want reactive arguments to your resource, you'll need to use a technique to _defer_ evaluating the value, this could be an arrow-function, object of getters, or a config object/class-instance. This is a topic for another time tho, on general-reactivity. 


