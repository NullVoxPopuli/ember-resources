<!-- vi: tabstop=3 noexpandtab -->

# ember-resources

1. [Introduction](./README.md) 👈 You are here
2. [Resources](./resources.md) 
3. [Usage in Ember](./ember.md)


- [ ] what is a cell?
  - [ ] can resources be used without cells?
        (yes, any reactive state can be used within, around, and passed to a resource, but ember has not had a good enough primitive -- so that's where cell steps in -- tracked could be thought of as a wrapper around a cell) 
- [ ] why does cleanup matter?
- [ ] Frame as primitive
  - [ ] when learning a reactive system / library resources are about the third primitive you'd learn values, functions, and then functions with cleanup.
       - link to tutorial
            - values: https://tutorial.glimdown.com/2-reactivity/1-values
            - functions: https://tutorial.glimdown.com/2-reactivity/4-functions
            - (etc)
      - in part, this is covered by the starbeam docs: 
          - 
  - [ ] intro to reactivity? (how much of the starbeam docs would I need to end up copying / reframing from ember's perspective?)
- [x] have a README.md in the docs folder, which is the highest level overview of _reactivity_
  - [ ] what are ember-octane's reactive primitives?
  - [ ] how can we reframe reactive-primitives to be more portable?
       why do we care about them being more portable?
  - [ ] how does starbeam fit in?
       this library aligns with starbeam, it's goals -- _kind of_ a polyfill
  - [ ] (link to resource.md)
- [ ] on the ember.md page, show the "anatomy" of a few resources, pointing out the "reactive function", "reactive state", etc



## Reactivity in Ember Octane

With the introduction of Ember's first edition, Octane, a new Reactivity system was introduced, ["tracked properties"](https://blog.emberjs.com/octane-is-here/#toc_glimmer-reactivity).

By the end of the v3.x series, we had _two_ user-facing reactive primitives:

- `@tracked`  
  In Ember Octane, it was assumed that all reactive state, "root state", 
  would exist on a property in class instance, 
  which could then be decorated with the `@tracked` decorator. 
  This allows the decorator to define a [getter and setter](https://github.com/tc39/proposal-decorators#class-auto-accessors) so that the reactivity system can operate while still allowing "native property getting and setting" (e.g.: without `Ember.get` and `Ember.set`).

- functions  
  In Ember Octane and before, these were called "helpers". It wasn't until [`ember-source@4.5`](https://blog.emberjs.com/ember-4-5-released) that plain functions became supported as a reactive primitive without [the polyfill](https://github.com/ember-polyfills/ember-functions-as-helper-polyfill). However, "helpers", (now called ["classic helpers"](https://guides.emberjs.com/v5.0.0/components/helper-functions/#toc_classic-helpers)) had two implementations: a simpler function-based version, and class-based version. These both required framework-specific abstractions to use and build, but the class-based version of these classic helpers had cleanup capabilities (albeit, awkwardly, via inheritance).

## Rethinking Reactivity

- values  
  A value is the most basic kind of reactive primitive. It's a place to store data that can be updated atomically. Updates to values take effect immediately.

- functions  
  JavaScript has a built in mechanism for computing values based on other values: functions. Supporting functions as a reactive primitive, as well as their arguments, is essential for reducing the number of abstractions folks need to learn. 

- functions with cleanup  
  Many things in a JavaScript app require cleanup, but it is often forgotten about, leading to memory leaks, increased network activity, and increased CPU usage. This includes handling timers, intervals, fetch, sockets, etc.
   

These are general concepts that extend beyond Ember or any framework -- and this is what [Starbeam](https://www.starbeamjs.com/) is solving -- _Universal Reactivity_.

### _This is where Starbeam comes in_

In Starbeam,
- Values are [_`Cell`s_](https://www.starbeamjs.com/guides/fundamentals/cells.html)
- Functions are just [functions](https://www.starbeamjs.com/guides/fundamentals/functions.html)
- Functions with cleanup are [_`Resource`s_](https://www.starbeamjs.com/guides/fundamentals/resources.html)

And Starbeam is planned for inclusion in the next [edition](https://emberjs.com/editions/) of Ember, Polaris.

`ember-resources` is a _sort of_ polyfill for Starbeam for use in Ember, supporting `ember-source@3.28.0`+

When Starbeam is integrated in to Ember, there will be codemods to help migrate.

### Values

This is a reactive value.
```js 
const greeting = cell('Hello there!');
```
It can be read and updated, just like a `@tracked` function.

<details><summary>Re-implementing @tracked</summary>

When framing reactivity this way, the implementation of `@tracked` is only a handful of lines:

```js 
function tracked(target, key, descriptor) { /* "legacy decorator" (stage 1) */
  let cache = new WeakMap();
  let getCell = (ctx) => {
    let reactiveValue = cache.get(ctx);
    if (!reactiveValue) {
      cache.set(ctx, reactiveValue = cell(descriptor.initializer?.()));
    }
    return reactiveValue;
  }
  return {
    get() {
      return getCell(this).current;
    },
    set(value) {
      getCell(this).set(value);
    }
  }
}
```

Note that this decorator style is using the [Stage 1 / Legacy Decorators](https://github.com/wycats/javascript-decorators/blob/e1bf8d41bfa2591d949dd3bbf013514c8904b913/README.md)

See also [`@babel/plugin-proposal-decorators`](https://babeljs.io/docs/babel-plugin-proposal-decorators#version)


</details>

Here is an [interactive demo showcasing values](https://tutorial.glimdown.com/2-reactivity/1-values) and how tracked state is no longer constrained to the boundary of a class.

<details><summary>Code for the demo</summary>

```gjs
import { cell } from 'ember-resources';

const greeting = cell("Hello there!");

// Change the value after 3 seconds
setTimeout(() => {
  greeting.current = "General Kenobi!";
}, 3000);

<template>
  Greeting: {{greeting.current}}
</template>
```

</details>

Here is an [interactive demo showcasing `@tracked`](https://tutorial.glimdown.com/2-reactivity/2-decorated-values), but framed in way that builds off of this new "value" primitive.

<details><summary>Code for the demo</summary>

```gjs
import { tracked } from '@glimmer/tracking';

class Demo {
  @tracked greeting = 'Hello there!';
}

const demo = new Demo();

// Change the value after 3 seconds
setTimeout(() => {
  demo.greeting = "General Kenobi!";
}, 3000);

<template>
  Greeting: {{demo.greeting}}
</template>
```

</details>

### Functions

Here is an interactive demo showcasing how [functions are reactive](https://tutorial.glimdown.com/2-reactivity/4-functions)

<details><summary>Code for the demo</summary>

```gjs
import { cell } from 'ember-resources';

const greeting = cell("Hello there!");
const shout = (text) => text.toUpperCase();

// Change the value after 3 seconds
setTimeout(() => {
  greeting.current = "General Kenobi!";
}, 3000);

<template>
  Greeting: {{ (shout greeting.current) }}
</template>
```

</details>


### Functions with cleanup

_Why does cleanup matter?_



Here is an interactive demo showcasing how [resources are reactive functions with cleanup](https://tutorial.glimdown.com/2-reactivity/5-resources)

<details><summary>Code for the demo</summary>

```gjs 
import { resource, cell } from 'ember-resources';

const Clock = resource(({ on }) => {
  let time = cell(new Date());
  let interval = setInterval(() => time.current = new Date(), 1000);

  on.cleanup(() => clearInterval(interval));

  return () => time.current;
});

<template>
  It is: <time>{{Clock}}</time>
</template>
```

</details>


## References

- [Starbeam](https://www.starbeamjs.com/) - Reactivity Made Simple and Fun
- [State in Ember](https://guides.emberjs.com/v5.0.0/components/component-state-and-actions/#toc_tracked-properties)
- @pzuraq's Reactivity Series
  - [What is Reactivity?](https://www.pzuraq.com/blog/what-is-reactivity)
  - [What makes a Good Reactive System?](https://www.pzuraq.com/blog/what-makes-a-good-reactive-system)
  - [How Autotracking Works](https://www.pzuraq.com/blog/how-autotracking-works) 
  - [Autotracking Case Study - TrackedMap](https://www.pzuraq.com/blog/autotracking-case-study-trackedmap)
- [Reactive Programming](https://en.wikipedia.org/wiki/Reactive_programming) (Wikipedia)
- Pull-based Reactivity
  - [Starbeam](https://www.starbeamjs.com/) - Reactivity Made Simple and Fun
- Event / Push-based Reactivity
  - [Solid.JS](https://www.solidjs.com/guides/reactivity)


