---
"ember-resources": minor
---

Add the ability to compose function resources.
This is enabled only for function resources as class-based resources could already compose.

<details><summary>how function resources compose</summary>

```js
let formatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hour12: false,
});

let format = (time) => formatter.format(time.current);

// representing the current time.
// This could be rendered directly as {{Now}}
// but Date does not serialize nicely for humans (Date.now() is a number)
const Now = resource(({ on }) => {
  let now = cell(Date.now());
  let timer = setInterval(() => now.set(Date.now()), 1000);

  on.cleanup(() => clearInterval(timer));

  return () => now.current;
});

const Clock = resource(({ use }) => {
  let time = use(Now);

  return () => format(time);
});

// Rendered, Clock is always the formatted time
<template>
  <time>{{ Clock }}</time>
</template>;
```

</details>
