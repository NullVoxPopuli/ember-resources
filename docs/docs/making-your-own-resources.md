
### Making your own Resources with

#### `Resource`

Resources extending this base class have no lifecycle hooks to encourage data-derivation (via getters) and
generally simpler state-management than you'd otherwise see with the typical lifecycle-hook-aware Resource.

For example, this is how you'd handle initial setup, updates, and teardown with a `Resource`

```js
import { Resource } from 'ember-resources';
import { registerDestructor } from '@ember/destroyable';

class MyResource extends Resource {
  constructor(owner, args, previous) {
    super(owner, args, previous);

    if (!previous) {
      // initial setup
    } else {
      // update
    }

    registerDestructor(this, () => {
      // teardown function for each instance
    });
  }
}
```
This works much like `useFunction`, in that the previous instance is passed to the next instance and there
is no overall persisting instance of `MyResource` as the `args` update. This technique eliminates the need
to worry about if your methods, properties, and getters might conflict with the base class's API, which is
a common complaint among the anti-class folks.

Many times, however, you may not even need to worry about destruction, which is partially what makes opting
in to having a "destructor" so fun -- you get to choose how much lifecycle your `Resource` has.

More info: [`@ember/destroyable`](https://api.emberjs.com/ember/release/modules/@ember%2Fdestroyable)

**So why even have a class at all?**

You may still want to manage state internal to your resource, such as if you were implementing a
"bulk selection" resource for use in tabular data. This hypothetical resource may track its own
partial / all / none selected state. If the args to this resource change, you get to decide if you
want to reset the state, or pass it on to the next instance of the selection resource.

```js
import { Resource } from 'ember-resources';

class Selection extends Resource {
  @tracked state = NONE; /* or SOME, ALL, ALL_EXCEPT */

  constructor(owner, args, previous) {
    super(owner, args, previous);

    let { filterQueryString } = args.named;

    if (previous && previous.args.named.filterQueryString !== filterQueryString) {
      // reset the state when the consumer has changed which records we care about.
      this.state = NONE;
    }
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
  records = useResource(this, EmberDataQuery, () => ({ filter: this.filter }));

  // the `this.selection.state` property is re-set to NONE when `this.filter` changes
  selection = useResource(this, Selection, () => ({ filterQueryString: this.filter }))
}
```

For library authors, it may be a kindness to consumers of your library to wrap the `useResource`
call so that they only need to manage one import -- for example:

```js
// addon/index.js

// @private
import { Selection } from './wherever/it/is.js';

// @public
export function useSelection(destroyable, thunk) {
  return useResource(destroyable, Selection, thunk);
}
```

Another example of interacting with previous state may be a "load more" style data loader / pagination:

```js
import { Resource } from 'ember-resources';
import { isDestroyed, isDestroying } from '@ember/destroyable';

class DataLoader extends Resource {
  constructor(owner, args, previous) {
    super(owner, args, previous);

    this.results = previous?.results;

    let { url, offset } = this.args.named;

    fetch(`${url}?offset=${offset}`)
      .then(response => response.json())
      .then(results => {
        if (isDestroyed(this) || isDestroying(this)) return;

        this.results = this.results.concat(result);
    });
  }
}
```
consumption of the above resource:
```js
import { useResource } from 'ember-resources';

class MyComponent extends Component {
  @tracked offset = 0;

  data = useResource(this, DataLoader, () => ({ url: '...', offset: this.offset }));

  // when a button is clicked, load the next 50 records
  @action loadMore() { this.offset += 50; }
}
```



#### `function` Resources

While functions can be "stateless", Resources don't provide much value unless
you can have state. `function` Resources solve this by passing the previous
invocation's return value as an argument to the next time the function is called.

In addition to that state, all function resources inherently track async state for you
so you can use plain functions, async or not, in your derived data patterns in you apps
and libraries.

There are two flavors of function resources
 - `trackedFunction`
 - `useFunction`

##### `trackedFunction`

##### `useFunction`

