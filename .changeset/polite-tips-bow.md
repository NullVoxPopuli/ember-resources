---
"ember-resources": minor
---

Introduce resources as modifiers.
This brings alignment with Starbeam's plans for modifiers as a universal primitive.

In ember-resources, using modifiers as resources looks like this:

```js
import { resource } from 'ember-resources';
import { modifier } from 'ember-resources/modifier';

const wiggle = modifier((element, arg1, arg2, namedArgs) => {
    return resource(({ on }) => {
        let animation = element.animate([
            { transform: `translateX(${arg1}px)` },
            { transform: `translateX(-${arg2}px)` },
        ], {
            duration: 100,
            iterations: Infinity,
        });

        on.cleanup(() => animation.cancel());
    });
});

<template>
    <div {{wiggle 2 5 named="hello"}}>hello</div>
</template>
```

The signature for the modifier here is _different_ from `ember-modifier`, where positional args and named args are grouped together into an array and object respectively.

This signature for ember-resource's `modifier` follows the [plain function invocation](https://blog.emberjs.com/plain-old-functions-as-helpers/) signature.

<details><summary>in Starbeam</summary>

```js
import { resource } from '@starbeam/universal';

function wiggle(element, arg1, arg2, namedArgs) {
    return resource(({ on }) => {
        let animation = element.animate([
            { transform: `translateX(${arg1}px)` },
            { transform: `translateX(-${arg2}px)` },
        ], {
            duration: 100,
            iterations: Infinity,
        });

        on.cleanup(() => animation.cancel());
    });
}

<template>
    <div {{wiggle 2 5 named="hello"}}>hello</div>
</template>
```

</details>
