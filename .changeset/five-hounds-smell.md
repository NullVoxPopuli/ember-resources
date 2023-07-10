---
"ember-resources": patch
---

Fix an issue with a new (not yet used feature) where Resources could directly return a `Cell`, and it would have its `.current` method automatically called when resolving the value of a Resource.

```gjs
import { resource, cell } from 'ember-resources';

export const Now = resource(({ on }) => {
  const now = cell(Date.now());
  const timer = setInterval(() => now.set(Date.now()));

  on.cleanup(() => clearInterval(timer));

  return now;
});


<template>
  It is: <time>{{Now}}</time>
</template>
```
