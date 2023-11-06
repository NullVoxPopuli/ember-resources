# What are "lifetimes"?

Sometimes known as [Object lifetime](https://en.wikipedia.org/wiki/Object_lifetime) is the timespan between creation and destruction of an object.

Resources have two possible lifetimes:
- Resources' lifetime is _linked_ to their parent context
    - this is typically in JavaScript, on a component, service, or custom class
- Resources' lifetime is contained within the block in which they are rendered
    - this is typically in the template

## When is a resource created?

In JavaScript, a resource is created only upon access. Like services, there is no runtime cost to the definition of the property that you'll eventually use. Only when accessed does something happen (that something being the initial invocation of the resource). 

In templates, a resource is created / initially invoked when rendered.

## When is a resource destroyed?

In JavaScript, a resource is destroyed when the parent / containing object is destroyed. This could be when a component is no longer needed, when or when a service is destroyed, such as what would happen at the end of a test.

In templates, a resource is destroyed when it is no longer rendered.

```hbs
{{#if condition}}
    
    {{LocalizedClock 'en-US'}}

{{/if}}
```

In this example, the `LocalizedClock` will be created when `condition` is true, and then destroyed when `condition` is false.


When a resource is destroyed, its `on.cleanup()` (set of) function(s) runs.
