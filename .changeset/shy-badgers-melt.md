---
"ember-resources": patch
---

Fix situation where, when composing with blueprint/factory-creted Resources, the owner was not passed to the t`used`d resource.

<details><summay>Example from the added test</summary>

```js
const Now = resourceFactory((ms = 1000) =>
  resource(({ on }) => {
    let now = cell(nowDate);
    let timer = setInterval(() => now.set(Date.now()), ms);

    on.cleanup(() => clearInterval(timer));

    return () => now.current;
  })
);

const Stopwatch = resourceFactory((ms = 500) =>
  resource(({ use }) => {
    let time = use(Now(ms));

    return () => format(time);
  })
);

await render(<template><time>{{Stopwatch 250}}</time></template>);
```

The owner is part of the hooks API for `resource` and an error is thrown when it is undefined - regardless if used.


```js
const Demo = resource(({ on, use, owner }) => {
  // ...
});
```

</details>
