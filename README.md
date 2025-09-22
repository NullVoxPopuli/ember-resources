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

For `ember-resources@v6.x`, see [the v6 branch](https://github.com/NullVoxPopuli/ember-resources/tree/v6)

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
- [API Reference](https://ember-resources.nullvoxpopuli.com/)


## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## Contributors

<!-- readme: contributors -start -->
<table>
	<tbody>
		<tr>
            <td align="center">
                <a href="https://github.com/NullVoxPopuli">
                    <img src="https://avatars.githubusercontent.com/u/199018?v=4" width="100;" alt="NullVoxPopuli"/>
                    <br />
                    <sub><b>NullVoxPopuli</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/renovate-bot">
                    <img src="https://avatars.githubusercontent.com/u/25180681?v=4" width="100;" alt="renovate-bot"/>
                    <br />
                    <sub><b>Mend Renovate</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/semantic-release-bot">
                    <img src="https://avatars.githubusercontent.com/u/32174276?v=4" width="100;" alt="semantic-release-bot"/>
                    <br />
                    <sub><b>Semantic Release Bot</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/gossi">
                    <img src="https://avatars.githubusercontent.com/u/283700?v=4" width="100;" alt="gossi"/>
                    <br />
                    <sub><b>Thomas Gossmann</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/MichalBryxi">
                    <img src="https://avatars.githubusercontent.com/u/847473?v=4" width="100;" alt="MichalBryxi"/>
                    <br />
                    <sub><b>Michal Bryxí</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/johanrd">
                    <img src="https://avatars.githubusercontent.com/u/4601554?v=4" width="100;" alt="johanrd"/>
                    <br />
                    <sub><b>johanrd</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/wagenet">
                    <img src="https://avatars.githubusercontent.com/u/9835?v=4" width="100;" alt="wagenet"/>
                    <br />
                    <sub><b>Peter Wagenet</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/backspace">
                    <img src="https://avatars.githubusercontent.com/u/43280?v=4" width="100;" alt="backspace"/>
                    <br />
                    <sub><b>Buck Doyle</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/HeroicEric">
                    <img src="https://avatars.githubusercontent.com/u/602204?v=4" width="100;" alt="HeroicEric"/>
                    <br />
                    <sub><b>Eric Kelly</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/kategengler">
                    <img src="https://avatars.githubusercontent.com/u/444218?v=4" width="100;" alt="kategengler"/>
                    <br />
                    <sub><b>Katie Gengler</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/lolmaus">
                    <img src="https://avatars.githubusercontent.com/u/200884?v=4" width="100;" alt="lolmaus"/>
                    <br />
                    <sub><b>Andrey Mikhaylov (lolmaus)</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/BoussonKarel">
                    <img src="https://avatars.githubusercontent.com/u/55881713?v=4" width="100;" alt="BoussonKarel"/>
                    <br />
                    <sub><b>BoussonKarel</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/iamdtang">
                    <img src="https://avatars.githubusercontent.com/u/687449?v=4" width="100;" alt="iamdtang"/>
                    <br />
                    <sub><b>David Tang</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/sukima">
                    <img src="https://avatars.githubusercontent.com/u/70075?v=4" width="100;" alt="sukima"/>
                    <br />
                    <sub><b>Devin Weaver</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/ciur">
                    <img src="https://avatars.githubusercontent.com/u/24827601?v=4" width="100;" alt="ciur"/>
                    <br />
                    <sub><b>Eugen Ciur</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/GreatWizard">
                    <img src="https://avatars.githubusercontent.com/u/1322081?v=4" width="100;" alt="GreatWizard"/>
                    <br />
                    <sub><b>Guillaume Gérard</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/JimSchofield">
                    <img src="https://avatars.githubusercontent.com/u/23246869?v=4" width="100;" alt="JimSchofield"/>
                    <br />
                    <sub><b>Jim Schofield</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/ozywuli">
                    <img src="https://avatars.githubusercontent.com/u/5769153?v=4" width="100;" alt="ozywuli"/>
                    <br />
                    <sub><b>Ozy Wu-Li</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/patocallaghan">
                    <img src="https://avatars.githubusercontent.com/u/685034?v=4" width="100;" alt="patocallaghan"/>
                    <br />
                    <sub><b>Pat O'Callaghan</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/sergey-zhidkov">
                    <img src="https://avatars.githubusercontent.com/u/3965890?v=4" width="100;" alt="sergey-zhidkov"/>
                    <br />
                    <sub><b>Sergey Zhidkov</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/simonihmig">
                    <img src="https://avatars.githubusercontent.com/u/1325249?v=4" width="100;" alt="simonihmig"/>
                    <br />
                    <sub><b>Simon Ihmig</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/kaermorchen">
                    <img src="https://avatars.githubusercontent.com/u/11972062?v=4" width="100;" alt="kaermorchen"/>
                    <br />
                    <sub><b>Stanislav Romanov</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/StephanH90">
                    <img src="https://avatars.githubusercontent.com/u/88476449?v=4" width="100;" alt="StephanH90"/>
                    <br />
                    <sub><b>Stephan Hug (FlyingNoodle)</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/ember-tomster">
                    <img src="https://avatars.githubusercontent.com/u/17934356?v=4" width="100;" alt="ember-tomster"/>
                    <br />
                    <sub><b>ember-tomster</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/Yelinz">
                    <img src="https://avatars.githubusercontent.com/u/30687616?v=4" width="100;" alt="Yelinz"/>
                    <br />
                    <sub><b>Yelin Zhang</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/cyk">
                    <img src="https://avatars.githubusercontent.com/u/423755?v=4" width="100;" alt="cyk"/>
                    <br />
                    <sub><b>cyk</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/danwenzel">
                    <img src="https://avatars.githubusercontent.com/u/11724146?v=4" width="100;" alt="danwenzel"/>
                    <br />
                    <sub><b>Dan Wenzel</b></sub>
                </a>
            </td>
		</tr>
	<tbody>
</table>
<!-- readme: contributors -end -->

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


