# ember-resources

## 6.0.0-beta.1

### Major Changes

- [#785](https://github.com/NullVoxPopuli/ember-resources/pull/785) [`66cee0e`](https://github.com/NullVoxPopuli/ember-resources/commit/66cee0e3cb91a4baa6b8a35aed8c67c2d05322a3) Thanks [@NullVoxPopuli](https://github.com/NullVoxPopuli)! - The import path `ember-resources/util/function-resource` has been removed,
  as all the relevent exports have been available from `ember-resources` since v5.

### Minor Changes

- [#794](https://github.com/NullVoxPopuli/ember-resources/pull/794) [`8989bbb`](https://github.com/NullVoxPopuli/ember-resources/commit/8989bbb1afb41404f27c76a0b083f7bb46d7fc9e) Thanks [@NullVoxPopuli](https://github.com/NullVoxPopuli)! - New Utils: UpdateFrequency and FrameRate

  NOTE: for existing users of `ember-resources`, this addition has no impact on your bundle.

  <details><summary>FrameRate</summary>

  Utility that uses requestAnimationFrame to report
  how many frames per second the current monitor is
  rendering at.

  The result is rounded to two decimal places.

  ```js
  import { FramRate } from "ember-resources/util/fps";

  <template>{{ FrameRate }}</template>;
  ```

  </details>

  <details><summary>UpdateFrequency</summary>

  Utility that will report the frequency of updates to tracked data.

  ```js
  import { UpdateFrequency } from 'ember-resources/util/fps';

  export default class Demo extends Component {
    @tracked someProp;

    @use updateFrequency = UpdateFrequency(() => this.someProp);

    <template>
      {{this.updateFrequency}}
    </template>
  }
  ```

  NOTE: the function passed to UpdateFrequency may not set tracked data.

  </details>

### Patch Changes

- [#806](https://github.com/NullVoxPopuli/ember-resources/pull/806) [`00e8f2f`](https://github.com/NullVoxPopuli/ember-resources/commit/00e8f2f2f3f35fb3272629ff0e9c7dfbd1aaf9b0) Thanks [@sergey-zhidkov](https://github.com/sergey-zhidkov)! - `trackedTask` must return correct last value.

  Fixes the issue described at #793
  If the task was called multiple times and the last returned value was null or undefined,
  then trackedTask will return the previous value instead of the current one.

## 6.0.0-beta.0

### Major Changes

- [#715](https://github.com/NullVoxPopuli/ember-resources/pull/715) [`e8155b2`](https://github.com/NullVoxPopuli/ember-resources/commit/e8155b254cfef874287a3b1d0d9c562ed97b88dc) Thanks [@NullVoxPopuli](https://github.com/NullVoxPopuli)! - Drop support for TypeScript < 4.8 in order to support Glint.

- [#778](https://github.com/NullVoxPopuli/ember-resources/pull/778) [`901ae9a`](https://github.com/NullVoxPopuli/ember-resources/commit/901ae9a0b6919af8c66fb8102927d5dee0d2f694) Thanks [@NullVoxPopuli](https://github.com/NullVoxPopuli)! - The `map` utility resource has changed its first type-argument for better inference.

  The utility already supported inference, so this change should not impact too many folks.

  When explicit type-arguments were specified,

  ```ts
  class Demo {
    // previously
    a = map<Element>(this, {
      data: () => [
        /* ... list of Element(s) ... */
      ],
      map: (element) => {
        /* some transform */
      },
    });

    // now
    a = map<Element[]>(this, {
      data: () => [
        /* ... list of Element(s) ... */
      ],
      map: (element) => {
        /* some transform */
      },
    });
  }
  ```

  This is advantageous, because with `@tsconfig/ember`, the option `noUncheckedIndexedAccess`
  is enabled by default. This is a great strictness / quality option to have enabled,
  as arrays in javascript are mutable, and we can't guarantee that they don't change between
  index-accesses.

  _However_ the `map` utility resource explicitly disallows the indicies to get out of sync
  with the source `data`.

  But!, with `noUncheckedIndexedAccess`, you can only infer so much before TS goes the safe route,
  and makes the returned type `X | undefined`.

  For example, in these type-tests:

  ```ts
  import { map } from "ember-resources/util/map";
  import { expectType } from "ts-expect";

  const constArray = [1, 2, 3];

  b = map(this, {
    data: () => constArray,
    map: (element) => {
      expectType<number>(element);
      return element;
    },
  });

  // index-access here is *safely* `| undefined`, due to `constArray` being mutable.
  expectType<number | undefined>(b[0]);
  expectType<number | undefined>(b.values()[0]);

  // but when we use a const as const array, we define a tuple,
  // and can correctly infer and return real values via index access
  const tupleArray = [1, 2, 3] as const;

  c = map(this, {
    data: () => tupleArray,
    map: (element) => {
      expectType<number>(element);
      return element;
    },
  });

  // No `| undefined` here
  expectType<number>(c[0]);
  expectType<number>(c.values()[0]);
  ```

- [#779](https://github.com/NullVoxPopuli/ember-resources/pull/779) [`a471d9b`](https://github.com/NullVoxPopuli/ember-resources/commit/a471d9b2dad67a73062f9786869fdb00de25f79a) Thanks [@NullVoxPopuli](https://github.com/NullVoxPopuli)! - `trackedFunction` has a new API and thus a major version release is required.

  _Work by [@lolmaus](https://github.com/lolmaus)_

  tl;dr: the breaking changes:

  - no more manual initial value
  - `isResolved` is only true on success
  - `isError` has been renamed to `isRejected`
  - `isLoading` has been removed as it was redundant

  other changes:

  - `trackedFunction` is a wrapper around `ember-async-data`'s [`TrackedAsyncData`](https://github.com/tracked-tools/ember-async-data/blob/main/ember-async-data/src/tracked-async-data.ts)
  - behavior is otherwise the same

  NOTE: `trackedFunction` is an example utility of how to use auto-tracking with function invocation,
  and abstract away the various states involved with async behavior. Now that the heavy lifting is done by `ember-async-data`,
  `trackedFunction` is now more of an example of how to integrated existing tracked utilities in to resources.

  ***

  **Migration**

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

### Minor Changes

- [#778](https://github.com/NullVoxPopuli/ember-resources/pull/778) [`f841a98`](https://github.com/NullVoxPopuli/ember-resources/commit/f841a982197f64b0756f8ee9fc35ed3d690fa959) Thanks [@NullVoxPopuli](https://github.com/NullVoxPopuli)! - Use strictest possible settings with TypeScript so that consumers can't be stricter than this library

- [#776](https://github.com/NullVoxPopuli/ember-resources/pull/776) [`a99793e`](https://github.com/NullVoxPopuli/ember-resources/commit/a99793ed126366a9da40a8df632ac660f05b68b1) Thanks [@NullVoxPopuli](https://github.com/NullVoxPopuli)! - Glint is now supported starting with 1.0.0-beta.3

### Patch Changes

- [#769](https://github.com/NullVoxPopuli/ember-resources/pull/769) [`abaad4a`](https://github.com/NullVoxPopuli/ember-resources/commit/abaad4ad9974cf86632524f01bef331cfaa8d253) Thanks [@GreatWizard](https://github.com/GreatWizard)! - fix typo in map error message when checking if every datum is an object

## 5.6.2

### Patch Changes

- [#742](https://github.com/NullVoxPopuli/ember-resources/pull/742) [`dd7234a`](https://github.com/NullVoxPopuli/ember-resources/commit/dd7234a4054b6ffb546c95e234caceb7e703536e) Thanks [@NullVoxPopuli](https://github.com/NullVoxPopuli)! - When using the `resourceFactory` (blueprint in [Starbeam][docs-starbeam] terms),
  there was an issue where a returned `resource` would not get torn down when the
  surrounding context of the `resourceFactory` would get torn down.

  For example, in this situation,
  which has been added as the [second example][demo-polling] on [this blog post][gts-examples],

  ```js
  const poll = resourceFactory((fn, interval) => {
    return resource(({ on }) => {
      let x = setInterval(fn, interval);
      on.cleanup(() => clearInterval(x));
    });
  });
  ```

  usage would be:

  ```hbs
  {{poll someFn someSeconds}}
  ```

  So, when this was in an `if` statement, or in a component or route, or any content that could be torn down,
  the `on.cleanup` callback would not be called.

  This fix addresses the issue and the `on.cleanup` callback is now called.

  NOTE: this approach to using resources is equivelent to this 0-dependency solution to polling:

  ```ts
  import Component from "@glimmer/component";
  import type RouterService from "@ember/routing/router-service";
  import { helper } from "@ember/component/helper";
  import { service } from "@ember/service";

  const intervals = new WeakMap();

  export default class Demo extends Component {
    @service declare router: RouterService;

    poll = helper(function ([fn, interval]: [(...args: unknown[]) => unknown, number]) {
      if (!intervals.has(this)) {
        registerDestructor(this, () => clearInterval(intervals.get(this)));
      }
      clearInterval(intervals.get(this);
      intervals.set(this, setInterval(fn, interval));
    });

    refreshData = () => this.router.refresh();
  }
  ```

  ```hbs
  {{this.poll this.refreshData 4000}}
  ```

  [docs-starbeam]: https://www.starbeamjs.com
  [gts-examples]: https://nullvoxpopuli.com/2022-09-05-gjs-cookbook-examples#polling
  [demo-polling]: https://limber.glimdown.com/edit?format=glimdown&t=%23%20Polling%20data%0A%0AA%20common%20thing%20folks%20ask%20is%20to%20re-call%20%2F%20re-run%20the%20%5Broute%27s%20model%20hook%5D%5Broute-model%5D%20on%20some%20interval.%0A%0AThis%20technique%20can%20be%20used%20to%20poll%20anything%2C%20%0Anot%20just%20the%20%5Brouter%20service%5D%5Brouter-service%5D%27s%20%5B%60refresh%60%5D%5Brouter-refresh%5D%20method.%0AIt%20could%20be%20used%20for%20any%20function%2C%20%5B%60fetch%60%5D%5Bmdn-fetch%5D%2C%20plain%20old%20functions%2C%20etc.%0A%0AWhen%20polling%2C%20the%20most%20important%20thing%20to%20remember%20is%20that%20the%20polling%20function%20needs%20to%20be%20cancelled%20when%20the%20surrounding%20context%20is%20torn%20down%2C%20or%20if%20the%20app%20is%20destroyed.%20This%20is%20so%20that%20as%20you%20navigate%20within%20your%20app%2C%20or%20while%20running%20tests%2C%20a%20memory%20leak%20does%20not%20occur.%0A%0AThis%20approach%20uses%20%5B%60setInterval%60%5D%5Bmdn-setInterval%5D%20so%20as%20to%20not%20induce%20a%20%5B%60too%20much%20recursion%60%5D%5Bmdn-too-much-recursion%5D%20error.%0A%0A%5Brouter-service%5D%3A%20https%3A%2F%2Fapi.emberjs.com%2Fember%2Frelease%2Fclasses%2FRouterService%0A%5Brouter-refresh%5D%3A%20https%3A%2F%2Fapi.emberjs.com%2Fember%2F4.9%2Fclasses%2FRouterService%2Fmethods%2Frefresh%3Fanchor%3Drefresh%0A%5Broute-model%5D%3A%20https%3A%2F%2Fguides.emberjs.com%2Frelease%2Frouting%2Fspecifying-a-routes-model%2F%0A%5Bmdn-fetch%5D%3A%20https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FFetch_API%0A%5Bmdn-setInterval%5D%3A%20https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FsetInterval%0A%5Bmdn-too-much-recursion%5D%3A%20https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FJavaScript%2FReference%2FErrors%2FToo_much_recursion%0A%0A%60%60%60gjs%20live%20preview%0Aimport%20%7B%20on%20%7D%20from%20%27%40ember%2Fmodifier%27%3B%0Aimport%20%7B%20cell%2C%20resource%2C%20resourceFactory%20%7D%20from%20%27ember-resources%27%3B%0A%0Aconst%20show%20%3D%20cell(true)%3B%0Aconst%20pollCount%20%3D%20cell(0)%3B%0Aconst%20fetchData%20%3D%20()%20%3D%3E%20%7B%0A%20%20pollCount.current%2B%2B%3B%0A%20%20console.log(%27Fetching%20data%20(for%20pretend%20%2F%20example)%27)%3B%0A%7D%0Aconst%20ONE_SECOND%20%3D%201_000%3B%20%2F%2F%20ms%0A%0A%2F**********************************************************%0A%20*%20DEMO%20starts%20here%2C%20everything%20above%20is%20mostly%20irrelevant%0A%20**********************************************************%2F%0Aconst%20poll%20%3D%20resourceFactory((fn%2C%20interval)%20%3D%3E%20%7B%0A%20%20return%20resource((%7B%20on%20%7D)%20%3D%3E%20%7B%0A%20%20%20%20let%20x%20%3D%20setInterval(fn%2C%20interval)%3B%20%20%20%20%0A%20%20%20%20on.cleanup(()%20%3D%3E%20clearInterval(x))%3B%0A%20%20%7D)%3B%0A%7D)%3B%0A%0A%3Ctemplate%3E%0A%20%20Poll%20count%3A%20%7B%7BpollCount.current%7D%7D%3Cbr%3E%0A%20%20%3Cbutton%20%7B%7Bon%20%27click%27%20show.toggle%7D%7D%3EToggle%3C%2Fbutton%3E%3Cbr%20%2F%3E%0A%20%20%0A%20%20%7B%7B%23if%20show.current%7D%7D%0A%20%20%20%20%20Data%20is%20being%20polled.%0A%0A%20%20%20%20%20%7B%7Bpoll%20fetchData%20ONE_SECOND%7D%7D%0A%20%20%7B%7Belse%7D%7D%0A%20%20%20%20%20Polling%20is%20not%20occurring.%0A%20%20%7B%7B%2Fif%7D%7D%0A%0A%20%20%20%20%0A%3C%2Ftemplate%3E%0A%60%60%60

## 5.6.1

### Patch Changes

- [#684](https://github.com/NullVoxPopuli/ember-resources/pull/684) [`bd723d1`](https://github.com/NullVoxPopuli/ember-resources/commit/bd723d17168f26d3718771a6545c9438a33850a2) Thanks [@NullVoxPopuli](https://github.com/NullVoxPopuli)! - Improve contribution resistance by removing semantic-release/commits and switching to
  [Changesets](https://github.com/changesets/) for managing automatic release.

  The release automation and human intervention is just the right mix of both
  to make everything painless for all parties.

  This means:

  - contributors don't need to "adhere to the commit convention" - which was linted for and had no autofix
  - a preview PR will be created so folks can see what all is going in to a release
  - releases can be bundled, meaning not every commit going in to `main` needs to be releasable
    - this allows for simultaneous batches of breaking changes, and would have prevented some early churn in this package's history
  - and most importantly, changelogs are meant for humans (not machines), and Changeset allows for human-focused changelogs

  I'll be moving all of my addons to Changesets and away from semantic-release.

- [`b137837`](https://github.com/NullVoxPopuli/ember-resources/commit/b137837f3ca10d693c0c5be66b25aaebcd046bda) Thanks [@NullVoxPopuli](https://github.com/NullVoxPopuli)! - TypeScript 4.8 and 4.9 Support added

# [5.6.0](https://github.com/NullVoxPopuli/ember-resources/compare/v5.5.0...v5.6.0) (2022-11-02)

### Features

- **trackedFunction:** add a retry method ([8244049](https://github.com/NullVoxPopuli/ember-resources/commit/824404911d82185229c7b33e322789ac9a171154))

# [5.5.0](https://github.com/NullVoxPopuli/ember-resources/compare/v5.4.0...v5.5.0) (2022-10-27)

### Features

- **cell:** add update method to Cell class ([b0ce96c](https://github.com/NullVoxPopuli/ember-resources/commit/b0ce96c8bf3e3ddb1fb159cf79940f65051c54c5))

# [5.4.0](https://github.com/NullVoxPopuli/ember-resources/compare/v5.3.2...v5.4.0) (2022-09-10)

### Features

- owner is now available to function-based resources ([410bbf4](https://github.com/NullVoxPopuli/ember-resources/commit/410bbf4fe73dfb04fb0b9192141a547795884c51))

## [5.3.2](https://github.com/NullVoxPopuli/ember-resources/compare/v5.3.1...v5.3.2) (2022-09-08)

### Bug Fixes

- **Resource:** class-based resource had no inference on the thunk ([e3900f7](https://github.com/NullVoxPopuli/ember-resources/commit/e3900f7a2663212913f81de912138eb37b50c168))

## [5.3.1](https://github.com/NullVoxPopuli/ember-resources/compare/v5.3.0...v5.3.1) (2022-08-31)

### Bug Fixes

- **util, keepLatest:** improve isEmpty internal util logic ([3b9d753](https://github.com/NullVoxPopuli/ember-resources/commit/3b9d7539a2a0b9a8011e9a01f96ec1879cc65e25))

# [5.3.0](https://github.com/NullVoxPopuli/ember-resources/compare/v5.2.2...v5.3.0) (2022-08-28)

### Bug Fixes

- **strict-mode, gts:** improve type support for glint + gts and strict mode ([793a0f6](https://github.com/NullVoxPopuli/ember-resources/commit/793a0f64de5160b0c02a67db1c84d3d8b849aeaf))

### Features

- **@use:** now works with class-based resources ([0803f1f](https://github.com/NullVoxPopuli/ember-resources/commit/0803f1fc88d66036eeff9a70579600d1ecb072b4))

## [5.2.2](https://github.com/NullVoxPopuli/ember-resources/compare/v5.2.1...v5.2.2) (2022-08-27)

### Bug Fixes

- **cell:** improve typings of the cell utility ([5e3229d](https://github.com/NullVoxPopuli/ember-resources/commit/5e3229d6f809a8a9dd5ccb8561013cc8d6666340))

## [5.2.1](https://github.com/NullVoxPopuli/ember-resources/compare/v5.2.0...v5.2.1) (2022-08-04)

### Bug Fixes

- **keepLatest:** use consistent condition name ([1f177cc](https://github.com/NullVoxPopuli/ember-resources/commit/1f177ccf58ee2d9765045b3e04c5449d242f2067))

# [5.2.0](https://github.com/NullVoxPopuli/ember-resources/compare/v5.1.1...v5.2.0) (2022-08-04)

### Features

- new util -- keepLatest ([3e3d02c](https://github.com/NullVoxPopuli/ember-resources/commit/3e3d02c566ebe6d6e404317d3825e202128e6d22))

## [5.1.1](https://github.com/NullVoxPopuli/ember-resources/compare/v5.1.0...v5.1.1) (2022-07-30)

### Bug Fixes

- **resourceFactory:** reactivity now works when args to a resource change ([7c647ff](https://github.com/NullVoxPopuli/ember-resources/commit/7c647ffc784c5612e6d6b526359c2e77f5ecd945))

# [5.1.0](https://github.com/NullVoxPopuli/ember-resources/compare/v5.0.2...v5.1.0) (2022-07-29)

### Features

- **util:** add cell util ([bad3c1e](https://github.com/NullVoxPopuli/ember-resources/commit/bad3c1efe5e6e624ac5932be3bf7fdffd47d6f22))

## [5.0.2](https://github.com/NullVoxPopuli/ember-resources/compare/v5.0.1...v5.0.2) (2022-07-02)

### Bug Fixes

- **package:** widen peer range for @glint/template ([e98c906](https://github.com/NullVoxPopuli/ember-resources/commit/e98c9062ab05353f4aafd0e7c0f6de83f846ce49))

## [5.0.1](https://github.com/NullVoxPopuli/ember-resources/compare/v5.0.0...v5.0.1) (2022-06-23)

### Bug Fixes

- **package:** @glint/template can't be an 'optional' peerDependency - it is required ([65b4600](https://github.com/NullVoxPopuli/ember-resources/commit/65b46006ad40a218fce7638140fbd5bfd2cc44f4))

# [5.0.0](https://github.com/NullVoxPopuli/ember-resources/compare/v4.10.0...v5.0.0) (2022-06-22)

### chore

- **cleanup:** remove deprecated code ([d602bff](https://github.com/NullVoxPopuli/ember-resources/commit/d602bff47a12b397018ad70c2a852c11986341fc))
- **cleanup:** remove support for ember-concurrency@v1 ([33521be](https://github.com/NullVoxPopuli/ember-resources/commit/33521bed0bfe5ab8e7ddc18510459b0a1486c92b))

### Features

- **package:** glint support, minimum version requirements ([f78c8b2](https://github.com/NullVoxPopuli/ember-resources/commit/f78c8b246b5a64150c90b8210ef0f16766c1a050))
- **types, internal:** add type tests, try to re-widen typescript range to bring back support for TS 4.5+ ([bc33140](https://github.com/NullVoxPopuli/ember-resources/commit/bc331401e8391054ad809a3d7f9e850fa7b289b8))

### BREAKING CHANGES

- **package:** glint requires minimum versions to be bumped

* minimum ember is now `ember-source@3.28`.
  This is LTS and the most feature complete version of the 3.x series.
  3.24, the previous LTS, is no longer supported by the ember team and
  will not be receiving security patches. Since resources are a
  fairly new concept, and since Glint support is a priority,
  supporting earlier than 3.28 is not needed.
* @glimmer/tracking must now be at least 1.1.2
* Additional peer dependencies
  - @glint/template
    - @glimmer/component
    - ember-modifier
* `Resource.of` has been removed. It was wholley redundant since `.from` exists.
  `Resource.from` is more concise and provides better type inference.

- **cleanup:** all code marked for removal in v4 (for v5) has been
  removed. See:
  https://github.com/NullVoxPopuli/ember-resources/blob/main/MIGRATIONS.md
  for more information
- **cleanup:** drop support for ember-concurrency@v1
  - ember-concurrency (if using the tracked task) must now be at least v2
  - ember-concurrency@v1 _may_ still work, but any bug reports using
    ember-concurrency@v1 will be closed. ember-concurrency@v2 was
    released in February of 2021.

# [4.10.0](https://github.com/NullVoxPopuli/ember-resources/compare/v4.9.1...v4.10.0) (2022-06-19)

### Features

- **function-resource:** support encapsulated tracked state ([9800c14](https://github.com/NullVoxPopuli/ember-resources/commit/9800c14e9f1b79d604dc0273569ca5b049181c75))

## [4.9.1](https://github.com/NullVoxPopuli/ember-resources/compare/v4.9.0...v4.9.1) (2022-06-18)

### Bug Fixes

- **function-resource:** lifecycle fixes ([eb7c6b6](https://github.com/NullVoxPopuli/ember-resources/commit/eb7c6b6d3e48f9016efd5f6247f04972463426ad))

# [4.9.0](https://github.com/NullVoxPopuli/ember-resources/compare/v4.8.2...v4.9.0) (2022-06-11)

### Features

- **util:** add debounce example util ([357e266](https://github.com/NullVoxPopuli/ember-resources/commit/357e266ee290c64ab1ba454f1318a9da1bb21fd2))

## [4.8.2](https://github.com/NullVoxPopuli/ember-resources/compare/v4.8.1...v4.8.2) (2022-05-21)

### Bug Fixes

- **Resource:** fix an issue where certain usages would not entagle / update correctly ([83a459c](https://github.com/NullVoxPopuli/ember-resources/commit/83a459c5b3ed9f779f9eb90dbcef83b52daf60dc))

## [4.8.1](https://github.com/NullVoxPopuli/ember-resources/compare/v4.8.0...v4.8.1) (2022-05-20)

### Bug Fixes

- **RemoteData, function-resource:** wrapped template usage ([3975e65](https://github.com/NullVoxPopuli/ember-resources/commit/3975e6592bc71f8a525fd9debb6ab4f296489189))

# [4.8.0](https://github.com/NullVoxPopuli/ember-resources/compare/v4.7.1...v4.8.0) (2022-05-14)

### Features

- add `remoteData` and `RemoteData` utils ([f613791](https://github.com/NullVoxPopuli/ember-resources/commit/f6137916e1f75b87b2f19d0658335bebd081c76e))

## [4.7.1](https://github.com/NullVoxPopuli/ember-resources/compare/v4.7.0...v4.7.1) (2022-05-01)

### Bug Fixes

- add deprecations for the deprecated APIs ([5b07081](https://github.com/NullVoxPopuli/ember-resources/commit/5b07081f50f28a823a2e76668704667cee0e2ebd))

# [4.7.0](https://github.com/NullVoxPopuli/ember-resources/compare/v4.6.4...v4.7.0) (2022-05-01)

### Features

- add trackedFunction and function-resource ([3b6ebaf](https://github.com/NullVoxPopuli/ember-resources/commit/3b6ebafe069a4d17fb243cac947ce58138d26153))

## [4.6.4](https://github.com/NullVoxPopuli/ember-resources/compare/v4.6.3...v4.6.4) (2022-04-22)

### Bug Fixes

- **package, types:** remove space in version field in typesVersion. Remove main entry ([1b1b0ea](https://github.com/NullVoxPopuli/ember-resources/commit/1b1b0ea30acd1cbf442ca34d599e0e669d1ed717))

## [4.6.3](https://github.com/NullVoxPopuli/ember-resources/compare/v4.6.2...v4.6.3) (2022-04-21)

### Bug Fixes

- **docs, Resource:** there is no second arg passed to the constructor of Resource ([b21f386](https://github.com/NullVoxPopuli/ember-resources/commit/b21f3861bccfeed75d08ffa55e2bfbdab1d60cb2))

## [4.6.2](https://github.com/NullVoxPopuli/ember-resources/compare/v4.6.1...v4.6.2) (2022-04-20)

### Bug Fixes

- **types:** certain typescript scenarios need explicit typesVersions entries ([1346b0e](https://github.com/NullVoxPopuli/ember-resources/commit/1346b0e556ac51c6cd7d48db460ebe45878a3b90))

## [4.6.1](https://github.com/NullVoxPopuli/ember-resources/compare/v4.6.0...v4.6.1) (2022-04-12)

### Bug Fixes

- **build:** remove minification from built assets ([3bb54c7](https://github.com/NullVoxPopuli/ember-resources/commit/3bb54c7928f23560cf7067cb7cd48103ce31d2ad))

# [4.6.0](https://github.com/NullVoxPopuli/ember-resources/compare/v4.5.0...v4.6.0) (2022-04-10)

### Features

- **bundle:** minify built assets. core bundle is 827 bytes ([34113ae](https://github.com/NullVoxPopuli/ember-resources/commit/34113ae80f874fb699ebfe42f11da320e10f1c54))

# [4.5.0](https://github.com/NullVoxPopuli/ember-resources/compare/v4.4.0...v4.5.0) (2022-04-09)

### Bug Fixes

- **docs:** pin @types/eslint so docs can build ([bc10593](https://github.com/NullVoxPopuli/ember-resources/commit/bc105932292c2de7ec534bc884522fe9f17dbcf1))
- Move @ember/test-waiters to peerDependencies ([c6db46b](https://github.com/NullVoxPopuli/ember-resources/commit/c6db46bbb82c8a35fff6f1bcd9ecd6c89835133c))

### Features

- add replacement APIs under new import paths ([0025d3b](https://github.com/NullVoxPopuli/ember-resources/commit/0025d3bdb167068aeca7c7b6185346d85dd8f180))
- **docs, types:** fix types with the map resource. update docs ([4cce0c5](https://github.com/NullVoxPopuli/ember-resources/commit/4cce0c53d0478f2db6c868275eb036469da1bf84))

# [4.5.0](https://github.com/NullVoxPopuli/ember-resources/compare/v4.4.0...v4.5.0) (2022-04-09)

### Bug Fixes

- **docs:** pin @types/eslint so docs can build ([bc10593](https://github.com/NullVoxPopuli/ember-resources/commit/bc105932292c2de7ec534bc884522fe9f17dbcf1))
- Move @ember/test-waiters to peerDependencies ([c6db46b](https://github.com/NullVoxPopuli/ember-resources/commit/c6db46bbb82c8a35fff6f1bcd9ecd6c89835133c))

### Features

- add replacement APIs under new import paths ([0025d3b](https://github.com/NullVoxPopuli/ember-resources/commit/0025d3bdb167068aeca7c7b6185346d85dd8f180))
- **docs, types:** fix types with the map resource. update docs ([4cce0c5](https://github.com/NullVoxPopuli/ember-resources/commit/4cce0c53d0478f2db6c868275eb036469da1bf84))

# [4.4.0](https://github.com/NullVoxPopuli/ember-resources/compare/v4.3.5...v4.4.0) (2022-02-24)

### Features

- add declaration maps ([eff33e4](https://github.com/NullVoxPopuli/ember-resources/commit/eff33e4e813e6a32764f2da26747f6a7f1e5f5a7))

## [4.3.5](https://github.com/NullVoxPopuli/ember-resources/compare/v4.3.4...v4.3.5) (2022-02-24)

### Bug Fixes

- **types:** export TaskInstance and TaskIsh for ts-consumers ([96b8d64](https://github.com/NullVoxPopuli/ember-resources/commit/96b8d64087ff12058729d4dc52df5460651ae0fb))

## [4.3.4](https://github.com/NullVoxPopuli/ember-resources/compare/v4.3.3...v4.3.4) (2022-02-24)

### Bug Fixes

- `@ember/test-waiters` must be a peer dependency ([01866c7](https://github.com/NullVoxPopuli/ember-resources/commit/01866c7a251bc41e13b8db830bbea316285cfb4b)), closes [/github.com/NullVoxPopuli/ember-resources/issues/403#issuecomment-1048404119](https://github.com//github.com/NullVoxPopuli/ember-resources/issues/403/issues/issuecomment-1048404119)

## [4.3.3](https://github.com/NullVoxPopuli/ember-resources/compare/v4.3.2...v4.3.3) (2022-02-23)

### Bug Fixes

- types field in package.json now correctly points at the new file ([f3ab39c](https://github.com/NullVoxPopuli/ember-resources/commit/f3ab39c7d75b89b3aa041a0e648fb45015dc8592))

## [4.3.2](https://github.com/NullVoxPopuli/ember-resources/compare/v4.3.1...v4.3.2) (2022-02-22)

### Bug Fixes

- **package:** remove type:module for embroider compat ([635404c](https://github.com/NullVoxPopuli/ember-resources/commit/635404c33a6d1002a58579d70a049e47130b6799))

## [4.3.1](https://github.com/NullVoxPopuli/ember-resources/compare/v4.3.0...v4.3.1) (2022-02-05)

### Bug Fixes

- **useTask:** provide better ember-concurrency@v1 support ([eb7387e](https://github.com/NullVoxPopuli/ember-resources/commit/eb7387e32e639388a557fa34de50ddc799770ba8))

# [4.3.0](https://github.com/NullVoxPopuli/ember-resources/compare/v4.2.0...v4.3.0) (2022-02-03)

### Features

- **readme:** async-data example ([74e0682](https://github.com/NullVoxPopuli/ember-resources/commit/74e068276fc310c335d32535ce477fcf19d4db72))

# [4.2.0](https://github.com/NullVoxPopuli/ember-resources/compare/v4.1.3...v4.2.0) (2022-01-31)

### Features

- add [@use](https://github.com/use) decorator -- see README for usage ([1edfddf](https://github.com/NullVoxPopuli/ember-resources/commit/1edfddfff46f68a87b587e1dd5a2778eb926b259))

## [4.1.3](https://github.com/NullVoxPopuli/ember-resources/compare/v4.1.2...v4.1.3) (2021-12-21)

### Bug Fixes

- **deps:** update dependency @embroider/addon-shim to v0.48.1 ([b7342c4](https://github.com/NullVoxPopuli/ember-resources/commit/b7342c48116cb60e30f7b252e2e94c1fdaeab5c8))

## [4.1.2](https://github.com/NullVoxPopuli/ember-resources/compare/v4.1.1...v4.1.2) (2021-12-06)

### Bug Fixes

- **types:** compat with TS 4.5.1 ([88c9db9](https://github.com/NullVoxPopuli/ember-resources/commit/88c9db96ddfd8541799ceb86a5cda48b6ed3e659))

## [4.1.1](https://github.com/NullVoxPopuli/ember-resources/compare/v4.1.0...v4.1.1) (2021-12-05)

### Bug Fixes

- **types:** better ember-concurrency@v1 support in typescript ([91c8b20](https://github.com/NullVoxPopuli/ember-resources/commit/91c8b2066de18c2b7ec4b204c3649c4956e63d49))

# [4.1.0](https://github.com/NullVoxPopuli/ember-resources/compare/v4.0.1...v4.1.0) (2021-12-05)

### Features

- add trackedFunction ([4d7a89b](https://github.com/NullVoxPopuli/ember-resources/commit/4d7a89b1f6498646076515cbaf13059929b808ed))

## [4.0.1](https://github.com/NullVoxPopuli/ember-resources/compare/v4.0.0...v4.0.1) (2021-11-06)

### Bug Fixes

- **useTask:** re-test against ember-concurrency@v1 ([0bf0122](https://github.com/NullVoxPopuli/ember-resources/commit/0bf0122b684417fff0184ed03152841d34bd9fef))

# [4.0.0](https://github.com/NullVoxPopuli/ember-resources/compare/v3.2.4...v4.0.0) (2021-11-01)

### Features

- **readme:** declare ember-auto-import compatibility ([2701891](https://github.com/NullVoxPopuli/ember-resources/commit/2701891d342c91ce4bd9159c4f9d61732d5fc902))

### BREAKING CHANGES

- **readme:** ember-auto-import compatibility was not declared.

If any projects that previously used ember-auto-import@1,
this addon will no longer work for those projects until those projects
upgrade to either ember-auto-import@v2 or embroider.

This breaking change is to communicate the accidental compatibility
breaking with older projects. The last available version projects
without ember-auto-import@v2 can use is v3.2.2.

I'm declaring this an accidental breakage soley because compatibility
was not previosuly declared and any compatibliity with older projects
may as well have been "accidental".

For projects that already were using ember-auto-import@v2, there is no
breaking change. There is no behavioral difference in this addon's
features.

However, embroider and ember-auto-import@v2 users will no longer have
ember-resources count against their build times as V2 Addons are
pre-built during publish.

If you have any questions, feel free to open an issue at:
https://github.com/NullVoxPopuli/ember-resources/issues

## [3.2.4](https://github.com/NullVoxPopuli/ember-resources/compare/v3.2.3...v3.2.4) (2021-11-01)

### Bug Fixes

- **internal:** use correct config for the tooling lints ([7e6e8a4](https://github.com/NullVoxPopuli/ember-resources/commit/7e6e8a4e31d176dfc89b70c092a5b3b495a13112))

## [3.2.3](https://github.com/NullVoxPopuli/ember-resources/compare/v3.2.2...v3.2.3) (2021-10-31)

### Bug Fixes

- **readme:** specify v2 format ([3f6bb1b](https://github.com/NullVoxPopuli/ember-resources/commit/3f6bb1b63c748f1e57b9f9463ae9c4f471f8808d))

## [3.2.2](https://github.com/NullVoxPopuli/ember-resources/compare/v3.2.1...v3.2.2) (2021-10-19)

### Bug Fixes

- **deps:** update dependency ember-cli-htmlbars to v6 ([07465ab](https://github.com/NullVoxPopuli/ember-resources/commit/07465ab4372fd93543d1117e2a15da8ad894ad83))

## [3.2.1](https://github.com/NullVoxPopuli/ember-resources/compare/v3.2.0...v3.2.1) (2021-09-05)

### Bug Fixes

- **types:** useResource types now reflect that you _can_ make non-reactive resources ([9059c90](https://github.com/NullVoxPopuli/ember-resources/commit/9059c904d3eb082a244c4bbc306b186e2e665458)), closes [#48](https://github.com/NullVoxPopuli/ember-resources/issues/48)

# [3.2.0](https://github.com/NullVoxPopuli/ember-resources/compare/v3.1.3...v3.2.0) (2021-08-29)

### Bug Fixes

- **useFunction, typescript:** you may now specify a return type without specifying the args type ([fe0acff](https://github.com/NullVoxPopuli/ember-resources/commit/fe0acff308d1aa11c0e1933ba18e7bd538e19d2b))

### Features

- **readme:** document and test how would would compose useFunction ([cbc99c0](https://github.com/NullVoxPopuli/ember-resources/commit/cbc99c0782c2f8d94bfe19644f8cdeabc936aac7))
- **useHelper:** can now reactively invoke helpers from JS ([b51f10f](https://github.com/NullVoxPopuli/ember-resources/commit/b51f10fcc2fd9d0cd27ac8319325198ee3142a00))

## [3.1.3](https://github.com/NullVoxPopuli/ember-resources/compare/v3.1.2...v3.1.3) (2021-08-18)

### Bug Fixes

- **deps:** update dependency @ember/test-waiters to v3 ([47571ee](https://github.com/NullVoxPopuli/ember-resources/commit/47571eeb5c1ae28ffb4bbd6f30a7ce8338ed323a))

## [3.1.2](https://github.com/NullVoxPopuli/ember-resources/compare/v3.1.1...v3.1.2) (2021-08-03)

### Bug Fixes

- **types:** loosen the args type on the lifecycle resource ([56f96b0](https://github.com/NullVoxPopuli/ember-resources/commit/56f96b040488f7ee0a5b4c6cd4b6d03255186d73))

## [3.1.1](https://github.com/NullVoxPopuli/ember-resources/compare/v3.1.0...v3.1.1) (2021-08-01)

### Bug Fixes

- **108:** ensure that Args can be ommitted from Resources when unknown is ok ([34c07ff](https://github.com/NullVoxPopuli/ember-resources/commit/34c07fffd809cf3c89ae85650c4e3f36d58a7d01))
- **issue#108:** loosen the constraint on what named arguments are ([dff5be3](https://github.com/NullVoxPopuli/ember-resources/commit/dff5be3cef53bbee9c4c74cf8cceed72638bf78a)), closes [issue#108](https://github.com/issue/issues/108)

# [3.1.0](https://github.com/NullVoxPopuli/ember-resources/compare/v3.0.1...v3.1.0) (2021-07-31)

### Features

- **resource:** Resource without lifecycle hooks ([ae0656f](https://github.com/NullVoxPopuli/ember-resources/commit/ae0656fa45a5abf540efcb75699740b126e6638f))

## [3.0.1](https://github.com/NullVoxPopuli/ember-resources/compare/v3.0.0...v3.0.1) (2021-07-25)

### Bug Fixes

- **readme:** all code samples now include imports from ember-resources ([d7941f4](https://github.com/NullVoxPopuli/ember-resources/commit/d7941f4db22dd2457a4004f59aa0a15c167419a1)), closes [#87](https://github.com/NullVoxPopuli/ember-resources/issues/87)

# [3.0.0](https://github.com/NullVoxPopuli/ember-resources/compare/v2.0.1...v3.0.0) (2021-07-20)

### Features

- **functions:** all useFunction functions are now async ([01c6ffd](https://github.com/NullVoxPopuli/ember-resources/commit/01c6ffda29a0fcb02f722077aebc693413d6dd9f))

### BREAKING CHANGES

- **functions:** all functions async due to an issue that came up
  during production builds, where minification would optimize away the
  async/await when the function was a one liner, like:

```ts
async () => {
  return await ...
}
```

the `async` keyword was a clue to the `FunctionRunner` to go down a
different code branch (before running the function), but when the above
example function was minified, it became:

```ts
() => { return ... }
```

which then made the `FunctionRunner` go down the sync path, resulting
in the `value` being a promise, rather than the resolved value of the
promise.

## [2.0.1](https://github.com/NullVoxPopuli/ember-resources/compare/v2.0.0...v2.0.1) (2021-07-14)

### Bug Fixes

- **deps:** update dependency @ember/test-waiters to ^2.4.5 ([010dae3](https://github.com/NullVoxPopuli/ember-resources/commit/010dae3fabd81e3078c177714dc81d15a473523d))

# [2.0.0](https://github.com/NullVoxPopuli/ember-resources/compare/v1.3.1...v2.0.0) (2021-07-10)

### Features

- useFunction now supports an initialValue param ([6ba9e26](https://github.com/NullVoxPopuli/ember-resources/commit/6ba9e26b06409a80242d33c274343f653f131f61))

### BREAKING CHANGES

- useFunction is no longer an alias of useResource

## [1.3.1](https://github.com/NullVoxPopuli/ember-resources/compare/v1.3.0...v1.3.1) (2021-07-09)

### Bug Fixes

- **readme:** Correct example import of `useResource` ([5f99b22](https://github.com/NullVoxPopuli/ember-resources/commit/5f99b22aa7a3a04f3b8b1f638a257c11399094d8))

# [1.3.0](https://github.com/NullVoxPopuli/ember-resources/compare/v1.2.5...v1.3.0) (2021-06-25)

### Bug Fixes

- **readme:** table of contents links now work ([00a397f](https://github.com/NullVoxPopuli/ember-resources/commit/00a397f66a7617988af9a4d7f4c265ddb294962a))

### Features

- **types, docs:** document types and how to test with resources ([8545bb6](https://github.com/NullVoxPopuli/ember-resources/commit/8545bb65db7126a462826b7f8d2af149baa249a0))

## [1.2.5](https://github.com/NullVoxPopuli/ember-resources/compare/v1.2.4...v1.2.5) (2021-06-24)

### Bug Fixes

- **async functions:** properly entangle for the value and prevent infinite re-rendering ([ad268fe](https://github.com/NullVoxPopuli/ember-resources/commit/ad268feb9c420058c7c7219ca6da3f15bfce359f))

## [1.2.4](https://github.com/NullVoxPopuli/ember-resources/compare/v1.2.3...v1.2.4) (2021-06-24)

### Bug Fixes

- **types:** add type visibility to the FunctionRunner to keep private ([e051be9](https://github.com/NullVoxPopuli/ember-resources/commit/e051be9cbda6798a1327d2f4bfbbfab5540ad7ec))
- when an async function resolves, auto-tracking should do stuff ([6504660](https://github.com/NullVoxPopuli/ember-resources/commit/6504660e6abde1a78034432a7b9777d4a5afafdb))

## [1.2.3](https://github.com/NullVoxPopuli/ember-resources/compare/v1.2.2...v1.2.3) (2021-06-23)

### Bug Fixes

- **lifecycle:** support resources without a setup method ([d11e6fc](https://github.com/NullVoxPopuli/ember-resources/commit/d11e6fc9210e6ef2184730ba28205b285e90713b))

## [1.2.2](https://github.com/NullVoxPopuli/ember-resources/compare/v1.2.1...v1.2.2) (2021-06-17)

### Bug Fixes

- **deps:** update dependency ember-cli-typescript to ^4.2.1 ([7a987a0](https://github.com/NullVoxPopuli/ember-resources/commit/7a987a073b7d16df77da0a95e4a7495b63632a42))

## [1.2.1](https://github.com/NullVoxPopuli/ember-resources/compare/v1.2.0...v1.2.1) (2021-06-17)

### Bug Fixes

- **deps:** update dependency ember-cli-typescript to ^4.2.0 ([ad65662](https://github.com/NullVoxPopuli/ember-resources/commit/ad65662a1c7f55679c2652ef210c0e8c1361fc35))

# [1.2.0](https://github.com/NullVoxPopuli/ember-resources/compare/v1.1.0...v1.2.0) (2021-06-06)

### Bug Fixes

- **readme:** useTask is no longer coming soon -- it's here ([d9e85b6](https://github.com/NullVoxPopuli/ember-resources/commit/d9e85b6b9d5fd577c994887ff36deea809fe0e47))

### Features

- add useTask ([8637477](https://github.com/NullVoxPopuli/ember-resources/commit/8637477ba74f0f0b34579663b9493838ddc09358))

# [1.1.0](https://github.com/NullVoxPopuli/ember-resources/compare/v1.0.0...v1.1.0) (2021-06-06)

### Features

- make addon not private (oops) ([97eb257](https://github.com/NullVoxPopuli/ember-resources/commit/97eb257e750c2aa0d033ef0c0843cd91fe3510a8))

# 1.0.0 (2021-06-06)

### Bug Fixes

- embroider support ([330e4c2](https://github.com/NullVoxPopuli/ember-resources/commit/330e4c2d3296cb4e4ea1c87d2daff47d5e7f522d))

### Features

- function resources ([fff7e0b](https://github.com/NullVoxPopuli/ember-resources/commit/fff7e0bfb4a197449edf3a03de32869d1245db47))
- implement HelperManager ([82f258a](https://github.com/NullVoxPopuli/ember-resources/commit/82f258a169b6c3ddc7978373df9eb4122599c9d6))
- the LifecycleResource has its first passing test ([cef4396](https://github.com/NullVoxPopuli/ember-resources/commit/cef439639c6effce7f5a03326840b466903e23c4))
