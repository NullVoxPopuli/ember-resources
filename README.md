# ember-resources

[![npm version](https://badge.fury.io/js/ember-resources.svg)](https://badge.fury.io/js/ember-resources)
[![CI](https://github.com/NullVoxPopuli/ember-resources/actions/workflows/ci.yml/badge.svg?branch=main&event=push)](https://github.com/NullVoxPopuli/ember-resources/actions/workflows/ci.yml)
_An_ implementation of the _Resource_ pattern in Ember.JS.

- [Installation](#installation)
- [What is a Resource?](#what-is-a-resource)
- [API Documentation](https://ember-resources.pages.dev/modules)
- [Docs on the Primitives](https://github.com/NullVoxPopuli/ember-resources/blob/main/DOCS.md)
- [Testing](https://github.com/NullVoxPopuli/ember-resources/blob/main/docs/docs/testing.md)
- [Cookbook](https://github.com/NullVoxPopuli/ember-resources/tree/main/docs/docs/cookbook)
- [Contributing](#contributing)
- [Thanks](#thanks)

## Compatibility

* [ember-source][gh-ember-source] v3.28+
* [typescript][gh-typescript] v4.7+
* [ember-auto-import][gh-ember-auto-import] v2+
* [Glint][gh-glint] 0.8.3+
  * Note that updates to glint support will not be covered by this library's adherance to SemVer. All glint-related updates will be bugfixes until Glint is declared stable.

[gh-glint]: https://github.com/typed-ember/glint/
[gh-ember-auto-import]: https://github.com/ef4/ember-auto-import
[gh-ember-source]: https://github.com/emberjs/ember.js/
[gh-typescript]: https://github.com/Microsoft/TypeScript/releases

## Installation

```bash
npm install ember-resources
# or
yarn add ember-resources
# or
ember install ember-resources
```


See: [API Documentation](https://ember-resources.pages.dev/modules)
for more examples.

## Example (async utility)

```js
import { trackedFunction } from 'ember-resources/util/function';

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

## Example (function-based resource)

Visit the docs on [function-based resources](https://github.com/NullVoxPopuli/ember-resources/blob/main/DOCS.md#function-based-resources).

This alternate API is more general-purpose, but has the same behavior
as the above example.

```js
import { resource, use } from 'ember-resources/util/function-resource';
import { TrackedObject } from 'tracked-built-ins';

class MyClass {
  @tracked endpoint = 'starships';

  @use load = resource(({ on }) => {
    let state = new TrackedObject({});
    let controller = new AbortController();

    on.cleanup(() => controller.abort());

    fetch(`https://swapi.dev/api/${this.endpoint}`, { signal: controller.signal })
      .then(response => response.json())
      .then(data => {
        state.value = data;
        // ...
      })
      .catch(error => {
        state.error = error;
        // ...
      });

    return state;
  });
}
```
```hbs
{{#if this.load.value}}
  ...
{{else if this.load.error}}
  {{this.load.error}}
{{/if}}
```

## What is a Resource?

> Resources [...] bridge a gap between imperative programming and declarative programming.
>
> Ember templates are declarative. When we design a component [...] we are specifying declaratively the HTML that should be rendered. If the data used in the templates ever updates, then Ember will update the rendered output as well, and we don't have to worry about the details. We don't have to tell Ember which specific steps to take, and when - it figures everything out for us.

<div style="width: 100%; text-align: right;">
  <cite>pzuraq on "<em><a href="https://www.pzuraq.com/introducing-use">Introducing @use</a></em>"</cite>
</div>

So.. _what_ is a [[Resource]], really?

A _Resource_ is a behavior that can be used in both templates and javascript.

### In JavaScript

A Resource is an alternate API for
```js
import { cached } from '@glimmer/tracking';
import { SomeClass } from '../somewhere';

class A {
  @cached
  get myResource() {
    return new SomeClass(this.args.foo)
  }
}
```
In this example, `myResource` returns an instance of a class and will re-create that
class if `@foo` changes. That class can have its own internal state.

This requires at least 2 imports and 4 lines of code.

### In Templates

A Resource is a stateful helper:
```hbs
{{#let (my-resource @foo) as |someClassInstance|}}
  {{!-- ... --}}
{{/let}}
```
In this example, `my-resource` returns an instance of a class and will re-create that
class if `@foo` changes. That class can have its own internal state and is available
for use via the local variable `myResource`.

This requires a stateful helper by globally available to your app. Helpers are typically
stateless, so this would go against most guidance on helpers.


## Debugging and working with Resources

_More information contained in the `docs` folder_.

High-fidelity sourcemaps are provided in the original typescript.
However, you must be using embroider to take advantage of them.
Sourcemaps should work with ember-auto-import@v2+ in non-embroider builds as well,
but is untested.


Note, ember-resources is not guaranteed to be compatible with usage within `@computed` getters.
Only auto-tracking is supported.

## Related addons

List of addons that use and wrap `ember-resources` to provide more specific functionality:

- [ember-data-resources](https://github.com/NullVoxPopuli/ember-data-resources) - resources for reactive data fetching with ember-data
- [ember-use-sound](https://github.com/chrismllr/ember-use-sound) - a resource for interacting with audio files

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.


## License

This project is licensed under the [MIT License](LICENSE.md).


## Thanks


This library wouldn't be possible without the work of:
 - [@pzuraq](https://github.com/pzuraq)
 - [@josemarluedke](https://github.com/josemarluedke)

 - [More information on Resources](https://www.pzuraq.com/introducing-use/)
 - [Inspiration, ember-could-get-used-to-this](https://github.com/pzuraq/ember-could-get-used-to-this)


So much appreciate for the work both you have put in to Resources <3

-----------------------------


_This is a [V2-format Addon](https://github.com/emberjs/rfcs/pull/507) with V1 compatibility_
