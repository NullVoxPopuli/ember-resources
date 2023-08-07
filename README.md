# ember-resources

_An_ implementation of the _Resource_ pattern in Ember.JS.

[![npm version](https://badge.fury.io/js/ember-resources.svg)](https://badge.fury.io/js/ember-resources)
[![CI](https://github.com/NullVoxPopuli/ember-resources/actions/workflows/ci.yml/badge.svg?branch=main&event=push)](https://github.com/NullVoxPopuli/ember-resources/actions/workflows/ci.yml)
[![typescript@next](https://github.com/NullVoxPopuli/ember-resources/actions/workflows/weekly-typescript.yml/badge.svg?branch=main)](https://github.com/NullVoxPopuli/ember-resources/actions/workflows/weekly-typescript.yml)


## Compatibility

* [ember-source][gh-ember-source] v3.28+
* [typescript][gh-typescript] v4.8+
* [ember-auto-import][gh-ember-auto-import] v2+
* [Glint][gh-glint] v1.0.0-beta.3+

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

Or if you want to use `main` (unstable) from git, you can use this in your package.json:

```
"ember-resources": "github:NullVoxPopuli/ember-resources#dist"
```
Which comes from [this branch][self-dist] from [this automation][self-dist-ci]

[self-dist]: https://github.com/NullVoxPopuli/ember-resources/tree/dist
[self-dist-ci]: https://github.com/NullVoxPopuli/ember-resources/blob/main/.github/workflows/push-dist.yml

## Documentation

- [Intro](https://github.com/NullVoxPopuli/ember-resources/blob/main/docs/docs/README.md)
- [Resource Authoring](https://github.com/NullVoxPopuli/ember-resources/blob/main/docs/docs/resources.md)
- [Usage in Ember](https://github.com/NullVoxPopuli/ember-resources/blob/main/docs/docs/ember.md)
- [Concepts (Starbeam)](https://www.starbeamjs.com/guides/principle.html)
- [Interactive Tutorial](https://tutorial.glimdown.com/2-reactivity/5-resources)
    - [util: RemoteData](https://tutorial.glimdown.com/11-requesting-data/1-using-remote-data)
    - [util: keepLatest](https://tutorial.glimdown.com/12-loading-patterns/1-keeping-latest)
- [API Reference](https://ember-resources.pages.dev/modules)


## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.


## License

This project is licensed under the [MIT License](LICENSE.md).


## Thanks


This library wouldn't be possible without the work of:
 - [@pzuraq](https://github.com/pzuraq)
 - [@josemarluedke](https://github.com/josemarluedke)
 - [@wycats](https://github.com/wycats)


 - [Starbeam's Resource docs](https://www.starbeamjs.com/guides/fundamentals/resources.html)
 - [More information on Resources](https://www.pzuraq.com/introducing-use/)
 - [Inspiration, ember-could-get-used-to-this](https://github.com/pzuraq/ember-could-get-used-to-this)


So much appreciate for the work both you have put in to Resources <3


