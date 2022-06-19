# `fetch` with `AbortController`

- [class-based `Resource`](#using-resource)
- [function-based `resource`](#using-resource-1)

## Using [`Resource`](https://ember-resources.pages.dev/classes/core.Resource)

[🔝 back to top](#)

requires: (nothing)
```js
import { Resource } from 'ember-resources/core';
import { tracked } from '@glimmer/tracking';

class MyFetcher extends Resource {
  @tracked isError = false;
  @tracked isResolved = false;
  @tracked isLoading = true;
  @tracked error = null;
  @tracked value = null;

  #abortController;

  constructor(owner) {
    super(owner);

    registerDestructor(this, () => this.#abortController.abort());
  }

  modify(positional, named) {
     if (this.#signal) {
       this.#signal.abort();
     }

     this.#abortController = new AbortController();

     fetch(positonal[0], { signal: this.#abortController.signal })
       .then(result => {
         this.value = result;
         this.error = error;
         this.isLoading = false;
         this.isResolved = false;
       })
       .catch(error => {
         this.isError = true;
         this.error = error;
         this.isLoading = false;
         this.isResolved = false;
       });
  }
}

// usage:

class Demo {
  @tracked url = '...';

  myRequest = MyFetcher.from(this, () => [this.url]);
}
```

## Using [`resource`](https://ember-resources.pages.dev/modules/util_function_resource#resource)

[🔝 back to top](#)

requires:
 - tracked-built-ins
```js
import { use, resource } from 'ember-resources/util/function-resource';
import { TrackedObject } from 'tracked-built-ins';
import { tracked } from '@glimmer/tracking';

class Demo {
  @tracked url = '...';

  @use myData = resource(({ on }) => {
    let state = new TrackedObject({ isResolved: false, isLoading: true, isError: false, value: null, error: null });

    let controller = new AbortController();

    on.cleanup(() => controller.abort());

    fetch(this.url, { signal: controller.signal })
      .then(response => response.json())
      .then(data => {
        state.value = data;
        state.isResolved = true;
        state.isError = false;
        state.isLoading = false;
      })
      .catch(error => {
        state.error = error;
        state.isResolved = true;
        state.isError = true;
        state.isLoading = false;
        // ...
      });

    return state;
  })
}


which would be abstracted into a utility like:

export function fetch(argThunk) {
  return resource(({ on }) => {
     // all the same stuff as above
  });
}

// Usage

class Demo {
  @tracked url = '...';

  @use myData = fetch(() => this.url);
}
```
