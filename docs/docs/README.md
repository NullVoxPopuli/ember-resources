<!-- vi: tabstop=4 noexpandtab -->

# ember-resources

1. [Introduction](./README.md) 👈 You are here
2. [Resources](./resources.md) 
3. [Usage in Ember](./ember.md)

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

It's no secret that Ember's community is smaller than other javascript communities, so one of the goals of Polaris is to reduce the amount of maintenance that a small community needs to do. For example, the [embroider](https://github.com/embroider-build/embroider/) project aims to reduce the maintenance burden on the build system by using broader ecosystem tools such as webpack, vite, rollup, etc. Another example is the reactivity system, `@glimmer/tracking`. We don't need it to be specific to Ember, and in fact, the Starbeam project _is that_ -- Ember's Reactivity _for everyone_, and has focused on [`React`](https://www.starbeamjs.com/frameworks/react/) and [`Preact`](https://www.starbeamjs.com/frameworks/preact/) first, with [`Vue`](https://github.com/starbeamjs/starbeam/tree/main/packages) shortly behind. Reactivity is a non-trivial system that, with bigger community, can help lighten the load on ember maintainers, and additionally breathe new life (and performance) in to the framework by providing reactive primitives at a much lower layer in the tech stack.

<details><summary>Additional Starbeam primitives</summary>

While starbeam includes the 3 primitives listed above, 
there are still two more primitives coming -- not just because Ember needs them, but because 
all of JavaScript needs them.

Those primitives are:
- modifiers  
  The building blocks are here to build modifiers already, as modifiers are a resource builder that receives an element as one of its arguments.
- services  
  The building blocks are here to build services already, as services are resources where their lifetime is tied to the application, rather than something more ephemeral, like a component.

</details>

### ✨ ~ ember-resources ~ ✨ ~ Starbeam ~ ✨

`ember-resources` is a _sort of_ polyfill for Starbeam for use in Ember, supporting `ember-source@3.28.0`+. 

`ember-resources` is built in user-land on top of 100% public APIs.

When Starbeam is integrated in to Ember, there will be codemods to help migrate.

### Values

This is a reactive value.
```js 
const greeting = cell('Hello there!');
```
It can be read and updated, just like a `@tracked` function.

Here is an [interactive demo](https://tutorial.glimdown.com/2-reactivity/1-values) demonstrating how `cell` can be used anywhere (in this case, in module-space[^module-space])

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


[^module-space]: Even though we can define state in module-space, you typically do not want to do so in your apps. Adding state at the module level is a "module side-effect", and tree-shaking tools may not tree-shake if they detect a "module side-effect". Additionally, when state is, in some way, only created within the context of an app, that state is easily reset between tests (assuming that app state is not shared between tests).

> **Note** <br>
> Cells do not _replace_ `@tracked` or `TrackedObject` / `TrackedArray` or any other reactive state utility you may be used to, but they are another tool to use in your applications and libraries and are otherwise an implementation detail of the more complex reactive data-structures.

<details><summary>Deep Dive: Re-implementing @tracked</summary>

When framing reactivity in terms of "cells", the implementation of `@tracked` could be thought of as an abstraction around a `getter` and `setter`, backed by a private `cell`:

```js 
class Demo {
	#greeting = cell('Hello there!');

	get greeting() {
		return this.#greeting.current;
	}
	set greeting(value) {
		this.#greeting.set(value);
	}
}
```


And then actual implementation of the decorator, which abstracts the above, is only a handful of lines:

```js 
function tracked(target, key, descriptor) {
	let cache = new WeakMap();

	let getCell = (ctx) => {
		let reactiveValue = cache.get(ctx);

		if (!reactiveValue) {
			cache.set(ctx, reactiveValue = cell(descriptor.initializer?.()));
		}

		return reactiveValue;
	};

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

One huge advantage of this way of defining the lowest level reactive primitive is that we can escape the typical framework boundaries of components, routes, services, etc, and rely every tool JavaScript has to offer. Especially as Starbeam is being developed, abstractions made with these primitives can be used in other frameworks as well.  


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

This is a reactive function.

```js
function shout(text) {
	return text.toUpperCase();
}
```
It's _just a function_. And we don't like to use the word "just" in technical writing, but there are honestly 0 caveats or gotchyas here.

Used in Ember, it may look like this:
```js
function shout(text) {
	return text.toUpperCase();
}

<template>
	{{shout @greeting}}
</template>
```

The function, `shout`, is reactive: in that when the `@greeting` argument changes, `shout` will be re-called with the new value.


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

Many things in a JavaScript app require cleanup. We need to cleanup in order to:
- prevent memory leaks
- reduce unneeded network activity 
- reduce CPU usage 

This includes handling timers, intervals, fetch, sockets, etc.

_Resources_ are functions with cleanup, but cleanup isn't all they're conceptually concerned with.

>
> Resources Convert Processes Into Values 
>
> Typically, a resource converts an imperative, stateful process.
> That allows you to work with a process just like you'd work with any other reactive value.
> 

For details on resources, see the [Resources chapter](./resources.md).

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


-----------------------------------


Next: [Resources](./resources.md) 
