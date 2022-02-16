# ember-resources

[![npm version](https://badge.fury.io/js/ember-resources.svg)](https://badge.fury.io/js/ember-resources)
[![CI](https://github.com/NullVoxPopuli/ember-resources/actions/workflows/ci.yml/badge.svg?branch=main&event=push)](https://github.com/NullVoxPopuli/ember-resources/actions/workflows/ci.yml)
_An_ implementation of the _Resource_ pattern in Ember.JS.

- [Installation](#installation)
- [What is a Resource?](#what-is-a-resource)
- [API Documentation](https://ember-resources.pages.dev/modules)
<!-- - [Examples](./examples) -->
<!-- - [Testing]('./testing') -->
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


## Related addons

List of addons that use and wrap `ember-resources` to provide more specific functionality:

- [ember-data-resources](https://github.com/NullVoxPopuli/ember-data-resources) - resources for reactive data fetching with ember-data
- [ember-array-map-resource](https://github.com/NullVoxPopuli/ember-array-map-resource) - provides a useArrayMap function which returns a resource that reactively maps data per-element, so that when the overall collection is dirtied, only the changed/new/removed elements affect the mapped collection
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
