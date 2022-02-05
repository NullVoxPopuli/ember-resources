# Examples

Throughout all of these examples, you may notice that some _can be_ a bit of work,
maybe more suited towards libraries, rather than end-user app code.
It's still good to know the problem space, because when your developing an app, you
may not have the time to create a library so that your app's code is minimal.

#### How do you deal with async data?

Async data is a common problem in user interfaces.
In Ember, it's standard practice to load _minimally required_
data in a route, and any secondary or supplementary data in components.

For more information on thinking about async data,
_[Async data and autotracking in ember octane](https://v5.chriskrycho.com/journal/async-data-and-autotracking-in-ember-octane/)
by Chris Krycho_ may be of interest.

For example, if you wanted to lazily and reactively load data based on
an `@argument` passed to a component

<details><summary>In vanilla Ember, no addons</summary>

Since Octane, Ember has had no ergonomic way to deal with loading
data in components.  The most effective way to implement your own
data loading pattern is to use custom [Helpers](https://api.emberjs.com/ember/release/classes/Helper).

```js
// app/helpers/load-records.js
import Helper from '@ember/component/helper';
import { isDestroyed, isDestroying } from '@ember/destroyable';
import { tracked } from '@glimmer/tracking';

export default class LoadRecords extends Helper {
  @tracked value;

  get records() {
    return this.value ?? [];
  }

  // Cache is needed so we don't cause an infinite loop
  // - call helper
  // - helper "entangles" with tracked data (this.records -> this.value)
  // - this.value changes
  // - helper is re-invoked
  // - repeat
  //
  // The cache prevents re-requesting then this.value is set
  cache = new Map();

  compute([endpoint]) {
    this.makeRequest(endpoint);

    return this.records;
  }

  async makeRequest(endpoint) {
    if (this.cache.has(endpoint)) {
      // We have to await Promise.resolve() here
      // to disconnect reactivity from the helper, otherwise
      // we get an infinite rendering / revalidation assertion
      await Promise.resolve();

      let existing = this.cache.get(endpoint);

      // Don't set the value if we don't need to
      if (this.value && this.value === existing) {
        return;
      }

      this.value = existing;
    }

    let results = await get(`https://swapi.dev/api/${endpoint}`);

    // Destruction protection, as we can't assign values to destroyed objects
    // below (this.value = ...)
    if (isDestroyed(this) || isDestroying(this)) return;

    // If there is accidentally a second request running
    // simultaneously, we don't want to re-invalidate the cache
    if (this.cache.has(endpoint)) {
      return;
    }

    this.value = results;
    this.cache.set(endpoint, results);
  }
}

async function get(endpoint) {
  let response = await fetch(`https://swapi.dev/api/${endpoint}`);
  let json = await response.json();

  return json.results;
}
```
and then once your helper exists, usage would like the following:
```hbs
{{!-- endpoint is a string, "starships", "planets", etc --}}
{{#let (load-records @endpoint) as |records|}}
  {{#each records as |record|}}
    {{record.name}}<br>
  {{/each}}
{{/let}}
```

A few downsides with this approach:
- The helper is disconnected from the component that needs the behavior.
- The helper is globally resolveable and bleeds into other areas of the apps,
  preventing other similar behaviors from being implemented.
- It's non-obvious where helpers come from. Addons? App?
- A helper can _only_ be used within templates and can't be re-used in JavaScript.
- Lots of behavioral edge cases to deal with manually.
- Stale data problems when the `@endpoint` variable toggles between values.

Note that this is _without_ `@cached`, which landed in `ember-source` in 4.1.
Prior to 4.1 using `@cached` requires a [polyfill](https://github.com/ember-polyfills/ember-cached-decorator-polyfill).

</details>

<details><summary>With the `@cached` decorator</summary>

`@cached` landed in `ember-source` 4.1, and to use the decorator pre-4.1, you'll
need to install the [polyfill](https://github.com/ember-polyfills/ember-cached-decorator-polyfill).


With `@cached`, you now have two options:
 - continue with the helper approach above (but using `@cached` to help simplify things)
 - or move the logic to the component, which solves

This example will move the logic to the component, because eliminating the helper
also eliminates a few of the downsides mentioned in the previous example.

For re-use, this could be extracted to a _provider_ component.

```js
// app/components/load-records.js
import Component from '@glimmer/component';
import { cached, tracked } from '@glimmer/tracking';

export default class LoadRecords extends Component {
  // the @cached decorator here is required so that repeat
  // accesses to either request or records do not unnecessarily
  // create a new TrackedRequest for the same @endpoint
  @cached
  get request() {
    // A new TrackedRequest is created when @endpoint changes
    let trackedRequest = new TrackedRequest(this.args.endpoint);

    return trackedRequest;
  }

  get records() {
    return this.request.results ?? [];
  }
}

class TrackedRequest {
  @tracked results;
  @tracked error;

  constructor(endpoint) {
    get(endpoint)
      .then((results) => (this.results = results))
      .catch((error) => (this.error = error));
  }
}

async function get(endpoint) {
  let response = await fetch(`https://swapi.dev/api/${endpoint}`);
  let json = await response.json();

  return json.results;
}
```
```hbs
{{!-- app/components/load-records.hbs --}}
{{#each this.records as |record|}}
  {{record.name}}<br>
{{/each}}
```
and usage of this component would look like:
```hbs
<LoadRecords @endpoint="starships" />
```

This is a huge improvement over the previous example, but still has downsides:
 - You have to manage state of the request yourself
 - Still feels like a lot of ceremony for something that _"should be easy"_.
 - While `TrackedRequest` can be used in JavaScript, requiring a `@cached` getter
   to use it also feels like too much ceremony.

</details>

<details><summary>With Resources</summary>

This example uses `trackedFunction`, a light API wrapping a plain `Resource`.

```js
// app/components/load-records.js
import Component from '@glimmer/component';
import { trackedFunction } from 'ember-resources';

export default class LoadRecords extends Component {
  request = trackedFunction(this, async () => {
    let response = await fetch(`https://swapi.dev/api/${this.args.endpoint}`);
    let json = await response.json();

    return json.results;
  }),

  get records() {
    return this.request.value ?? [];
  }
}
```
```hbs
{{!-- app/components/load-records.hbs --}}
{{#each this.records as |record|}}
  {{record.name}}<br>
{{/each}}
```

</details>



### Web Permissions

TODO

### Selection

This example, non-async,

internal state management.

Could be written as

```js
@cached
get selection() {
  return new Selection(/* initial args here */)
}
```



