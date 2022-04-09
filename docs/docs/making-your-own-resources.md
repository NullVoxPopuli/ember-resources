
### Making your own Resources with

#### `Resource`

Resources extending this base class have only one lifecycle hook, `modify`, to encourage data-derivation (via getters) and
generally simpler state-management than you'd otherwise see with with additional lifecycle methods.

For example, this is how you'd handle initial setup, updates, and teardown with a `Resource`

```js
import { Resource } from 'ember-resources/core';
import { registerDestructor } from '@ember/destroyable';

class MyResource extends Resource {
  // constructor only needed if teardown is needed
  constructor(owner) {
    super(owner);

    registerDestructor(this, () => {
      // final teardown, if needed
    });
  }

  modify(positional, named) {
    // initial setup, updates, etc
  }
}
```
Many times, however, you may not even need to worry about destruction, which is partially what makes opting
in to having a "destructor" so fun -- you get to choose how much lifecycle your `Resource` has.

More info: [`@ember/destroyable`](https://api.emberjs.com/ember/release/modules/@ember%2Fdestroyable)

```js
import { Resource } from 'ember-resources/core';

class Selection extends Resource {
  @tracked state = NONE; /* or SOME, ALL, ALL_EXCEPT */

  modify(positional, { filterQueryString }) {
    if (previousQueryString !== filterQueryString) {
      // reset the state when the consumer has changed which records we care about.
      this.state = NONE;
    }

    this.previousQueryString = filterQueryString;
  }

  @action selectAll() { this.state = ALL; }
  @action deselectAll() { this.state = NONE; }
  @action toggleItem(item) { /* ... */ }
  // etc
}
```
usage of this Resource could look like this:
```js
// in either a component or route:
export default class MyComponent extends Component {
  @service router;

  get filter() {
    return this.router.currentRouter.queryParams.filter;
  }

  // implementation omitted for brevity -- could be passed to EmberTable or similar
  records = EmberDataQuery.from(this, () => ({ filter: this.filter }));

  // the `this.selection.state` property is re-set to NONE when `this.filter` changes
  selection = Selection.from(this, () => ({ filterQueryString: this.filter }))
}
```

For library authors, it may be a kindness to consumers of your library to wrap the `useResource`
call so that they only need to manage one import -- for example:

```js
// addon/index.js

// @private
import { Selection } from './wherever/it/is.js';

// @public
export function selection(destroyable, thunk) {
  return Selection.from(destroyable, thunk);
}
```

Another example of interacting with previous state may be a "load more" style data loader / pagination:

```js
import { Resource } from 'ember-resources/core';
import { isDestroyed, isDestroying } from '@ember/destroyable';

class DataLoader extends Resource {
  modify(positional, { url, offset }) {

    fetch(`${url}?offset=${offset}`)
      .then(response => response.json())
      .then(results => {
        if (isDestroyed(this) || isDestroying(this)) return;

        this.results = (this.results ?? []).concat(results);
    });
  }
}
```
consumption of the above resource:
```js
class MyComponent extends Component {
  @tracked offset = 0;

  data = DataLoader.from(this, () => ({ url: '...', offset: this.offset }));

  // when a button is clicked, load the next 50 records
  @action loadMore() { this.offset += 50; }
}
```



#### `trackedFunction`

TODO: write this

