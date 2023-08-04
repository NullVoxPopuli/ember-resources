# Using Resources with Ember

1. [Introduction](./README.md)
2. [Resources](./resources.md)
3. [Usage in Ember](./ember.md) 👈 You are here

`ember-resources` tries to stay out of your way when working with resources.

This document shows the mechanics of how to interact with a resource in ember.

## Direct usage in template

Using resources directly in templates uses no feature of `ember-resources`, but here we can review the various ways in which resources can be rendered.

### In Strict Mode / `<template>`

Resources work best in strict mode / gjs/gts / `<template>`.

For more information about this format, please see [this interactive tutorial](https://tutorial.glimdown.com)

```gjs
const Clock = resource(/* ... */);

<template>
  {{Clock}}
</template>
```

And then if your resource takes arguments:

```gjs
const Clock = resourceFactory((locale) => {
  return resource(/* ... */);
});

<template>
  {{Clock 'en-US'}}
</template>
```


### In Templates

In `ember-resources`, resources are powered by Ember's "Helper Manager" APIs, such as [`invokeHelper`](https://api.emberjs.com/ember/release/functions/@ember%2Fhelper/invokeHelper).

So in order to use resources in template-only components, they'll need to be re-exported in your `app/helpers/*` folder.

For example, by defining `app/helpers/clock.js`,
```js
export { Clock as default } from './location/of/clock';
```

you'd then be able to directly reference `Clock` in your template, albeit in the lower-kebab-case format (i.e.: if your helper is MultiWord, it's invoked as `multi-word`),

```hbs
{{ (clock) }}
```


### When the template has a backing class.

Because resources in `ember-resources` are backed by the Helper Manager API, and ever since "everything that has a value can be used in a template" [docs here](https://guides.emberjs.com/release/in-depth-topics/rendering-values/), we can _almost_ use resources in templates _as if_ you were using `<template>`.
This is not a feature of ember-resources, but it is a useful technique that we've been able to use since `ember-source@3.25`

```js
import { Clock } from './location/of/clock';
import Component from '@glimmer/component';

export default class Demo extends Component {
  /**
   * This looks goofy!
   * This assigns the value "Clock" to the property on Demo, "Clock"
   * [property] = value;
   *
   * It could also be
   * AClock = Clock, and then access in the template as this.AClock
   */
  Clock = Clock;
}
```
```hbs
{{this.Clock}}

{{! and if Clock takes arguments }}

{{this.Clock 'en-US'}}
```

## Usage in JavaScript

In JavaScript, we need a helper utility to bridge from native javascript in to ember's reactivity system.

When using `@use`, the host class will need to have [_the Owner_](https://api.emberjs.com/ember/5.0/modules/@ember%2Fowner) set on it.

Resources may only be composed within
- a class with an owner
- another resource (covered [here](./resources.md)


```js
import { use } from 'ember-resources';
import { Clock } from './location/of/clock';

class Demo {
  clock = use(this, Clock);
}
```

Or, if the resource takes arguments:

```js
import { use } from 'ember-resources';
import { Clock } from './location/of/clock';

class Demo {
  clock = use(this, Clock('en-US'));
}
```

If you need the argument(s) to the resource to be reactive, you can pass a function:

```js
import { use } from 'ember-resources';
import { tracked } from '@glimmer/tracking';
import { Clock } from './location/of/clock';

class Demo {
  @tracked locale = 'en-US';

  clock = use(this, Clock(() => this.locale));
}
```

<details><summary>why can't a decorator be used here?</summary>

When defining a function in the decorator

```js
class Demo {
  @use(Clock(() => this.locale)) clock;
  /* ... */
}
```

The arrow function does _not_ take on the context of the class instance,
because decorators are evaluated before an instance is created.
The `this` is actually the type of the context that the class is defined in.

This form of decorator *is* implemented, but it turned out to not be useful
enough for the variety of use cases we need for resource invocation.

Here is how it looks for no args, and static args, and both of these situations
work as you'd expect:

```js

import { use } from 'ember-resources';
import { Clock, ClockWithArgs } from './location/of/clock';

class Demo {
  @use(Clock) clock;
  @use(ClockWithArgs('en-US')) clockWithArg;
}
```

</details>

This technique with using a function is nothing special to ember-resources, and can be used with any other data / class / etc as well.

Further, if multiple reactive arguments are needed with individual reactive behavior, you may instead decide to have your `resourceFactory` receive an object.

<details><summary>about resourceFactory</summary>

`resourceFactory` is a pass-through function purely for telling ember to
invoke the underlying resource immediately after invoking the `resourceFactory` function.

Without `resourceFactory`, ember would need extra internal changes to support primitives that
don't yet exist within the framework to, by convention, decide to _double-invoke_ the functions.

The signature is basically `() => () => Value`, where we want to flatten that chain of functions to get the underlying `Value`.

</details>


```js
import { use } from 'ember-resources';
import { tracked } from '@glimmer/tracking';
import { Clock } from './location/of/clock';

class Demo {
  @tracked locale = 'en-US';
  @tracked timezone = 'America/New_York';

  clock = use(this, Clock({
    locale: () => this.locale,
    timeZone: () => this.timezone,
  }));
}
```

So when authoring a `Clock` that receives these types of function arguments, but _also_ needs to support being invoked from a template, how do you implement that?

```js
import { resourceFactory } from 'ember-resources';

export const Clock = resourceFactory(( args ) => {
  return resource(() => {
    let { locale, timeZone } = args;

    // each of locale and timeZone could be either be a
    // string or a function that returns a string
    let localeValue = typeof locale === 'function' ? locale() : locale;
    let timeZoneValue = typeof timeZone === 'function' ? timeZone() : timeZone;

    // ...
  });
});
```

<details><summary>using functions for fine-grained reactivity</summary>

Earlier, it was mentioned that this way of managing reactivity isn't specific to `ember-resources`.
That's because it's one technique you can use to build native classes in you app that have fine-grained reactivity.

For example, say you have a component:
```js
import Component from '@glimmer/component';

export default class Demo extends Component {
  /** ... */
}
```

And you have want to manage state in another class that doesn't necessarily need to a be a component.
For example, this could be a data abstraction, or a statemachine, or some other integration with the browser.

```js
class MyState {}
```

You can assign an instance of `MyState` to an instance of your component by calling `new`.

```js
import Component from '@glimmer/component';

export default class Demo extends Component {
  state = new MyState();

  /** ... */
}
```

but then to pass args, you may expect that you'd pass them like this:

```js
import Component from '@glimmer/component';

export default class Demo extends Component {
  state = new MyState(this.locale, this.timezone);

  /** ... */
}
```

But this is not reactive, because the values of `locale` and `timezone` are evaluated at the time of creating `MyState`.

We can delay auto-tracking by converting these properties to functions:
```js
import Component from '@glimmer/component';

export default class Demo extends Component {
  state = new MyState(() => this.locale, () => this.timezone);

  /** ... */
}
```

and then using them in getters:
```js
class MyState {
  constructor(localeFn, timeZoneFn) {
    this.#localeFn = localeFn;
    this.#timeZoneFn = timeZoneFn;
  }

  get locale() {
    return this.#localeFn();
  }

  get timeZone() {
    return this.#timeZoneFn();
  }
}
```

And then all the way back in our component template (`demo.hbs`), we can say:
```hbs
{{this.state.locale}}

and

{{this.state.timeZone}}
```

and each of the individual `{{ }}` usages will individually auto-track with the corresponding properties on `MyState`.


</details>


## Usage in TypeScript / Glint

### Typing the above examples

If you've used TypeScript in Ember before, this may look familiar as we declare the types on services in the same way. This follows the same pattern described [here](https://jamescdavis.com/declare-your-injections-or-risk-losing-them/)

```ts
import { use } from 'ember-resources';
import { Clock, ClockWithArgs } from './location/of/clock';

class Demo {
  clock = use(this, Clock);
// ^? string

  clock2 = use(this, ClockWithArgs('en-US'));
// ^? string
}
```

```ts
import { use } from 'ember-resources';
import { tracked } from '@glimmer/tracking';
import { Clock, ClockWithReactiveArgs } from './location/of/clock';

class Demo {
  @tracked locale = 'en-US';

  clock = use(this, ClockWithReactiveArgs(() => this.locale));
// ^? string
}
```


### For Library Authors

For TypeScript, you may have noticed that, if you're a library author, you may want to be concerned with supporting all usages of resources in all contexts, in which case, you may need to support overloaded function calls.

TypeScript does not support overloading anonymous functions, so we need to abstract the callback passed to `resourceFactory` into a named function, which we can then define overloads for.

Here is how the overloads for `Compiled`, the resource that represents a dynamically compiled component, provided by `ember-repl`, and used by https://limber.glimdown.com and https://tutorial.glimdown.com.

[compile/index.ts](https://github.com/NullVoxPopuli/limber/blob/main/packages/ember-repl/addon/src/browser/compile/index.ts)

```ts
// Additional types and APIs omitted for brevity
export function buildCompiler(markdownText: Input | (() => Input)): State;
export function buildCompiler(markdownText: Input | (() => Input), options?: Format): State;
export function buildCompiler(markdownText: Input | (() => Input), options?: () => Format): State;
export function buildCompiler(markdownText: Input | (() => Input), options?: ExtraOptions): State;
export function buildCompiler(markdownText: Input | (() => Input), options?: () => ExtraOptions): State;

export function buildCompiler(
  markdownText: Input | (() => Input),
  maybeOptions?: Format | (() => Format) | ExtraOptions | (() => ExtraOptions)
): State {
  return resource(() => {
    let maybeObject =
      typeof maybeOptions === 'function' ? maybeOptions() : maybeOptions;
    let format =
      (typeof maybeObject === 'string' ? maybeObject : maybeObject?.format) || 'glimdown';
    let options =
      (typeof maybeObject === 'string' ? {} : maybeObject) || {};

    let input = typeof markdownText === 'function' ? markdownText() : markdownText;

    /* ... */

    return () => ({
      isReady: ready.current,
      error: error.current,
      component: result.current,
    });
  });
}

export const Compiled = resourceFactory(buildCompiler) as typeof buildCompiler;
```

When defining `Compiled` this way, we can be type-safe in a variety of situations.
Note that when we invoke from a template, we don't need to worry about functions because,
in templates, all tracked values are inherently reactive, and will re-invoke functions appropriately.

> **Note** <br>
> The function concept here is this demo is _an_ example of how to pass on reactivity to future auto-tracking context. You could pass a `Cell` (created with this library's `cell` util), or some other instance of an object that has its own tracked properties. Functions, however, are a platform primitive that allows for easy demoing -- but it's important to use the abstraction that best fits your, and your team's, use case.

<details>
<summary>  Using `Compiled` as

`(doc: string) => State`

</summary>

- Usage in gjs directly in the template:

  ```gjs
  import { Compiled } from 'ember-repl';

  let doc = '...';

  <template>
    {{#let (Compiled doc) as |state|}}
       ...
    {{/let}}
  </template>
  ```
  This is reactive

- Usage in a class

  ```gjs
  import Component from '@glimmer/component';
  import { tracked } from '@glimmer/tracking';

  import { use } from 'ember-resources';
  import { Compiled } from 'ember-repl';

  export default class Demo extends Component {
    @tracked doc = '...';

    @use(Compiled(this.doc)) state;

    /* ... */
  }
  ```
  This is _not_ reactive because the value of `this.doc` is read when evaluating the decorator.

</details>


<details>
<summary>  Using `Compiled` as

`(doc: string, options: ExtraOptions) => State`

</summary>

- Usage in gjs directly in the template:
  ```gjs
  import { Compiled } from 'ember-repl';
  import { hash } from '@ember/helper';

  let doc = '...';

  <template>
    {{#let (Compiled doc (hash format='gjs')) as |state|}}
       ...
    {{/let}}
  </template>
  ```

- Usage in a class

  ```gjs
  import Component from '@glimmer/component';
  import { tracked } from '@glimmer/tracking';

  import { use } from 'ember-resources';
  import { Compiled } from 'ember-repl';

  export default class Demo extends Component {
    @tracked doc = '...';
    @tracked format = '...';

    state = use(this, Compiled(this.doc, { format: this.format }));

    /* ... */
  }
  ```
  This is _not_ reactive because the value both `this.doc` and the second arg are read when evaluating the decorator.

</details>


<details>
<summary>  Using `Compiled` as

`(doc: string, format: Format) => State`

</summary>

- Usage in gjs directly in the template:
  ```gjs
  import { Compiled } from 'ember-repl';
  import { hash } from '@ember/helper';

  let doc = '...';

  <template>
    {{#let (Compiled doc 'gjs') as |state|}}
       ...
    {{/let}}
  </template>
  ```


- Usage in a class
  ```gjs
  import Component from '@glimmer/component';
  import { tracked } from '@glimmer/tracking';

  import { use } from 'ember-resources';
  import { Compiled } from 'ember-repl';

  export default class Demo extends Component {
    @tracked doc = '...';
    @tracked format = '...';

    state = use(this, Compiled(this.doc, this.format));

    /* ... */
  }
  ```
  This is _not_ reactive because the value both `this.doc` and `this.format` are read when evaluating the decorator.

</details>



<details>
<summary>  Using `Compiled` as

`(doc: () => string) => State`

</summary>

- Usage in a class
  ```gjs
  import Component from '@glimmer/component';
  import { tracked } from '@glimmer/tracking';

  import { use } from 'ember-resources';
  import { Compiled } from 'ember-repl';

  let doc = '...';

  export default class Demo extends Component {
    @tracked doc = '';

    state = use(this, Compiled(() => this.doc));

    /* ... */
  }
  ```

</details>


<details>
<summary>  Using `Compiled` as

`(doc: () => string, format: Format) => State`

</summary>

- Usage in a class
  ```gjs
  import Component from '@glimmer/component';
  import { tracked } from '@glimmer/tracking';

  import { use } from 'ember-resources';
  import { Compiled } from 'ember-repl';

  let doc = '...';

  export default class Demo extends Component {
    @tracked doc = '';

    state = use(this, Compiled(() => this.doc, 'gjs'));

    /* ... */
  }
  ```

</details>

<details>
<summary>  Using `Compiled` as

`(doc: () => string, format: () => Format) => State`

</summary>

- Usage in a class
  ```gjs
  import Component from '@glimmer/component';
  import { tracked } from '@glimmer/tracking';

  import { use } from 'ember-resources';
  import { Compiled } from 'ember-repl';

  let doc = '...';

  export default class Demo extends Component {
    @tracked doc = '';
    @tracked format = 'gjs';

    state = use(this, Compiled(() => this.doc, () => this.format));

    /* ... */
  }
  ```

</details>

<details>
<summary>  Using `Compiled` as

`(doc: () => string, options: ExtraOptions) => State`

</summary>

- Usage in a class
  ```gjs
  import Component from '@glimmer/component';
  import { tracked } from '@glimmer/tracking';

  import { use } from 'ember-resources';
  import { Compiled } from 'ember-repl';

  let doc = '...';

  export default class Demo extends Component {
    @tracked doc = '';

    state = use(this, Compiled(() => this.doc, { format: 'gjs', ...extraOptions }));

    /* ... */
  }
  ```

</details>


<details>
<summary>  Using `Compiled` as

`(doc: () => string, options: () => ExtraOptions) => State`

</summary>

- Usage in a class
  ```gjs
  import Component from '@glimmer/component';
  import { tracked } from '@glimmer/tracking';

  import { use } from 'ember-resources';
  import { Compiled } from 'ember-repl';

  let doc = '...';

  export default class Demo extends Component {
    @tracked doc = '';
    @tracked options = { format: 'gjs', ...extraOptions };

    state = use(this, Compiled(() => this.doc, () => this.options));

    /* ... */
  }
  ```

Note that for this example, it's possible to have as fine-grained reactivity as you want:

  ```gjs
  import Component from '@glimmer/component';
  import { tracked } from '@glimmer/tracking';

  import { use } from 'ember-resources';
  import { Compiled } from 'ember-repl';

  let doc = '...';

  export default class Demo extends Component {
    @tracked doc = '';

    // this isn't supported by the example, but it's possible to implement,
    // if the need is there
    state = use(this, Compiled(() => this.doc), {
        format: () => this.format,
        foo: () => this.foo,
        bar: () => this.bar,
    });

    /* ... */
  }
  ```

</details>


-----------------------------



Previous: [Resources](./resources.md) 👈 You are here
