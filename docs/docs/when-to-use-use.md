# When to use `use`?

`use` connects resources to _JavaScript_ contexts.

<details><summary>Why do we need to connect anything?</summary>
    
Any non-standand JavaScript pattern needs an abstraction to use. With components, we use `<AngleBracket />` syntax within a rendering system (which then, in turn, gives us a bunch of other convinient things). With resources in JavaScript `use` is an abstraction over the implementation details that ultimately don't matter to users. 

Imagine why you need [`@service`](https://api.emberjs.com/ember/5.4/functions/@ember%2Fservice/service) for [dependency injection](https://nullvoxpopuli.com/2020-08-08-how-does-di-work) -- it's the glue to hide the details of what would otherwise by very verbose to use without the abstraction.

</details>

Note that all of these examples use a `Component` class, but they could just as well be any native vanilla JavaScript class. See [link](https://ember-resources.pages.dev/funcs/link.link) for more on that.

## `import { use } from 'ember-resources';`

This type of use is for connecting a resource to a JavaScript class.

It has a couple different overloads so that the community can provide feedback on the ergonomics of each over time.


<details><summary>Under the hood</summary>

`use` uses [`invokeHelper`](https://api.emberjs.com/ember/release/functions/@ember%2Fhelper/invokeHelper) which means that resources _are_ helpers. It also means that other non-resource helpers could be passed to `use` (note tho that non-resource usage is not supported by this library).

There is a potential for a whole "usable system" here, piggy-backing off of the [helper-manager](https://rfcs.emberjs.com/id/0625-helper-managers/) pattern.

</details>

### `@use`


#### "@use thisProperty = DefinedAsThis"

This `@use` decorator _replaces_ the property with a getter that gets the underlying value of the resource. You'll see what happens in non-decorator form later.

<details><summary>looking under the hood</summary>

You could think of what the decorator does in this way:

```js
class Demo extends Component {
  @use data = Clock;
}
```
is (at runtime) transformed to:
```js
class Demo extends Component {
  #data1 = invokeHelper(this, Clock);
  
  get data() {
    return getValue(this.#data1);
  }
}
```

Note that the _actual_ return value of `resource` is an internal and private object, and interaction with that object is not supported in user-space.

</details>

In this example, the resource is the value of `data`:

```js
import Component from '@glimmer/component';
import { resource, use } from 'ember-resources';

const Clock = resource(() => {
    /* ... */
    return 2;
});

class Demo extends Component {
    @use data = Clock;

    <template>
        {{this.data}} prints 2
    </template>
}
```

In this example, the `resource` is still the value returned to `data`:

```js
import Component from '@glimmer/component';
import { resource, use } from 'ember-resources';

function LocalizedClock(locale) {
    return resource(() => {
        /* ... */
        return 2;
    });    
}

class Demo extends Component {
    @use data = LocalizedClock('en-US');

    <template>
        {{this.data}} prints 2
    </template>
}
```

#### "@use(ThisResource) namedThis"

This variant of `@use` _only_ works if the Resource does not take arguments.
It is the most constrained / least-flexible way to use `@use`.

<details><summary>but why?</summary>

This is because the left-hand side of decorators exists outside of an instance, so no instance properties may be accessed, because there is no instance.

One way to think of how decorators work right now, is to "in your head", transform the code from:

```js
import Component from '@glimmer/component';
import { resource, use } from 'ember-resources';

const Clock = resource( ... );

class Demo extends Component {
    @use(Clock) time;
}
```

To

```js
import Component from '@glimmer/component';
import { resource, use } from 'ember-resources';

const Clock = resource( ... );

class Demo extends Component {}

let decorator = use(Clock);
Object.defineProperty(Demo.prototype, {
    get() {
        return decorator(this, 'data', /* ... */);
    }
}
```

</details>

```js
import Component from '@glimmer/component';
import { resource, use } from 'ember-resources';

const Clock = resource(() => 2);

class Demo extends Component {
    @use(Clock) time;

    <template>
        {{this.time}} prints 2
    </template>
}
```

### `use(...)`

This version of `use` does not require decorators, which may be useful if you're in an environment where either you don't have the ability to use decorators, or you are composing contexts, or you want to pass a lazily evaluated pre-configured resource around your application.

The returned value here is a `ReadonlyCell`, meaning you get the value of the resource via a `.current` property.

```js
import Component from '@glimmer/component';
import { resource, use } from 'ember-resources';

const Clock = resource(() => 2);

class Demo extends Component {
    data = use(this, Clock);

    <template>
        {{this.data.current}} prints 2
    </template>
}
```


## `resource(({ use }) => { /* ... */ })`

This type of `use` is only available _within_ resources, and is meant for composing other resources.

For example: 
```js 
const Clock = resource( /* ... */ );

function LocalizedClock(locale) {
    return resource(({ use }) => {
        const clock = use(Clock);

        /* ... format defined in here ... */

        return () => {
            return format(clock.current);
        }
    });
}
```

Like the non-decorator version of `@use`, above, we access the _current_ value via `.current`.

And just the same as before, when we have a function that returns resources (a resource factory):


```js 
const Clock = resource( /* ... */ );

function LocalizedClock(locale) {
    return resource(({ use }) => {
        const clock = use(Clock);

        /* ... format defined in here ... */

        return () => {
            return format(clock.current);
        }
    });
}

const SoManyClocks = resource(({ use }) => {
    let enUS = use(LocalizedClock('en-US'));
    let esPR = use(LocalizedClock('es-PR'));
    let koKR = use(LocalizedClock('ko-KR'));

    return {
        get enUS() {
            return enUS.current;
        },
        get esPR() {
            return esPR.current;
        },
        get koKR() {
            return koKR.current;
        }
    };
});
```
