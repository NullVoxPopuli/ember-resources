# Resources[^starbeam]


> **Key Point** <br>
> A resource is a reactive function with cleanup logic.

Resources are created with an owner, and whenever the owner is cleaned up, the resource is also cleaned up. This is called ownership linking.

Typically, a component in your framework will own your resources. The framework renderer will make sure that when your component is unmounted, its associated resources are cleaned up.

<details>
<summary>Resources Convert Processes Into Values</summary>

Typically, a resource converts an imperative, stateful process, such as an asynchronous request or a ticking timer, into a reactive value.

That allows you to work with a process just like you'd work with any other reactive value.

This is a very powerful capability, because it means that adding cleanup logic to an existing reactive value doesn't change the code that works with the value.

The only thing that changes when you convert a reactive value into a resource is that it must be instantiated with an owner. The owner defines the resource's lifetime. Once you've instantiated a resource, the value behaves like any other reactive value.

</details>

## A Very Simple Resource

To illustrate the concept, let's create a simple resource that represents the current time.

```js 
import { cell, resource } from "ember-resources";
 
export const Now = resource(({ on }) => {
  const now = cell(Date.now());
 
  const timer = setInterval(() => {
    now.set(Date.now());
  });
 
  on.cleanup(() => {
    clearInterval(timer);
  });
 
  return now;
});
```

<details><summary>In Starbeam</summary>

```js 
import { Cell, Resource } from "@starbeam/universal";
 
export const Now = Resource(({ on }) => {
  const now = Cell(Date.now());
 
  const timer = setInterval(() => {
    now.set(Date.now());
  });
 
  on.cleanup(() => {
    clearInterval(timer);
  });
 
  return now;
});
```

</details>


> **💡**
> A resource's return value is a reactive value. If your resource represents a single cell, it's fine to return it directly. It's also common to return a function which returns reactive data -- that depends on reactive state that you created inside the resource constructor.

When you use the `Now` resource in a component, it will automatically get its lifetime linked to that component. In this case, that means that the interval will be cleaned up when the component is destroyed.

The `resource` function creates a resource Constructor. A resource constructor:

1. Sets up internal reactive state that changes over time.
2. Sets up the external process that needs to be cleaned up.
3. Registers the cleanup code that will run when the resource is cleaned up.
4. Returns a reactive value that represents the current state of the resource as a value.

In this case:


----------------------------------------

[^starbeam]: These docs have been adapted from the [Starbeam](https://www.starbeamjs.com/guides/fundamentals/resources.html) docs on Resources.

