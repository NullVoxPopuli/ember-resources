---
"ember-resources": patch
---

Resolves: https://github.com/NullVoxPopuli/ember-resources/issues/958

`use`d Resources can now be immediately returned from other resources.

```js
const Clock = resource(({ use }) => {
  return use(Instant({ intervalMs: 1000 });
});

const Stopwatch = resource(({ use }) => {
  return use(Instant({ intervalMs: 0 });
});

<template>
    <time>{{Clock}}</time>

    MS since Epoch: {{Stopwatch}}
</template>
```
