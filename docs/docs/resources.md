# Resources

1. [Introduction](./README.md)
2. [Resources](./resources.md) 👈 You are here
3. [Usage in Ember](./ember.md)

_this document has been adapted/copied[^copying] from the Starbeam[^starbeam] documentation_


This is a high-level introduction to Resources, and how to use them.
For how to integrate Resources in to Ember (Components, etc), see [./ember.md](./ember.md);

In addition to the live demos accompanying each code snippet, all code snippets will have their Starbeam counterparts below them, so that folks can see how similar the libraries are.

When Starbeam is integrated in to Ember, there will be a codemod to convert from ember-resources' APIs to Starbeam's APIs.

_details on that soon_


<hr>


> **Note** <br>
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

To see this code in action, [checkout the live demo](https://limber.glimdown.com/edit?c=MQAggiDKAuD2AOB3AhtAxgCwFBYCIFMBbWAOwGdoAnVAS1JFgDMRkQAlfM2AV0rXxDQMqEAGt8%2BeGUHU0ohs1yp8AOhKxELaQEduNOVpA1oINMhI4ABtYDmAK2kAbGgDd8WGoXixKJgN4glJw8fPgANKb4jo4gAL4gjJSwhCAA5EQARviUALRBXLz8ZKkA3Dj4AB7evqakFCAAchogALyBwYX4ABRdAfSxAJStAHwgflggteQm6ppt-NFdStCqs10DA2UgE1P10J7ZrSBk%2BNAAkiQrlC7Ijj1DLaPjk5OzKifQS8pqGuubO4MtjtSCo0I58OZuPB7iMxjtJmCIZQLlcbnd9oRsv9JoCdjsgtBeCQQLMyricAAeFZeRzKYY7M4mGhkABcICpB2Gfj8TUQsViFIA9Bj8PShdT4LSVvTrJYgA&format=glimdown).

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


> **:bulb:** <br>
> A resource's return value is a reactive value. If your resource represents a single cell, it's fine to return it directly. It's also common to return a function which returns reactive data -- that depends on reactive state that you created inside the resource constructor.

When you use the `Now` resource in a component, it will automatically get its lifetime linked to that component. In this case, that means that the interval will be cleaned up when the component is destroyed.

The `resource` function creates a resource Constructor. A resource constructor:

1. Sets up internal reactive state that changes over time.
2. Sets up the external process that needs to be cleaned up.
3. Registers the cleanup code that will run when the resource is cleaned up.
4. Returns a reactive value that represents the current state of the resource as a value.

In this case:

| internal state | external process | cleanup code | return value |
| ---- | ---- | ---- | ---- |
| `Cell<number>` | `setInterval` | `clearInterval` | `Cell<number>` |


<details><summary>Resource's values are immutable</summary>

When you return a reactive value from a resource, it will always behave like a generic, immutable reactive value. This means that if you return a `cell` from a resource, the resource's value will have `.current` and `.read()`, but not `.set()`, `.update()` or other cell-specific methods.

If you want your resource to return a value that can support mutation, you can return a JavaScript object with accessors and methods that can be used to mutate the value.

This is an advanced use-case because you will need to think about how external mutations should affect the running process.

</details>

## A Ticking Stopwatch

Here's a demo of a `Stopwatch` resource, similar to the above demo.
The main difference here is that the return value is a function.

```js
import { resource, cell } from 'ember-resources';

const formatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hour12: false,
});

export const Stopwatch = resource((r) => {
  const time = cell(new Date());

  const interval = setInterval(() => {
    time.set(new Date());
  }, 1000);

  r.on.cleanup(() => {
    clearInterval(interval);
  });

  return () => {
    const now = time.current;

    return formatter.format(now);
  };
});
```

To see this code in action, [checkout the live demo](https://limber.glimdown.com/edit?c=MQAggiDKAuD2AOB3AhtAxgCwFBYCIFMBbWAOwGdoAnVAS1JFgDMRkQAlfM2AV0rXxDQMqEAGt8%2BeGUHU0ohsyEC0vSvhLRBNQvgA0LEgBMQjWJUKppNTYgzqQao-ko0SAcwB0OAAa%2B3AK2kAGxoAN3wsbXgzTQBvB04ePj0QfiCgkABfE0pYQhAAciIAI2cAWjUuXn4yAoBuHDRSChMzC2hoZxAAXhASfEQQAEkNII9cVHwAFW18ADE21AAKACJ1MoBVSBX9WKwQEAwkgC4QFZJuHRc0Hf2QQlduTtPzy%2BcaG907snwmoxeLlcPrcDkdeABGABMp0YyCCPy%2BmQAlA0sH8WjAECh0Bgegkqsklkt4vRkT0AHwgPYHdGaaCzPFpIJLfqDCadJZIlF3WkgVydSihOF4n7QEYCoXMzkUrQ6DwqSiOTS9Vkgdn4Tn6cEABl13LupHlQXwyAu8CJSJlaGNyEo4uckqW-IdcK5qIOamgvBIIGl3Up1IOqWamhIsEGvXpcoVSvdQc93ta5lQAo8pmT0BZ4e5B0yWGRqIAPJ1CPAgpNyXchpoaGRTsXZuTYrFMUhUJhMplCwB6KP4Ss9ktlitYXzeIA&format=glimdown).

<details><summary>In Starbeam</summary>

```js
import { Cell, Formula, Resource } from "@starbeam/universal";

export const Stopwatch = Resource((r) => {
  const time = Cell(new Date());

  const interval = setInterval(() => {
    time.set(new Date());
  }, 1000);

  r.on.cleanup(() => {
    clearInterval(interval);
  });

  return Formula(() => {
    const now = time.current;

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    }).format(now);
  });
});
```

</details>

A description of the `Stopwatch` resource:

| internal state | external process | cleanup code | return value |
| ---- | ---- | ---- | ---- |
| `Cell<Date>` | `setInterval` | `clearInterval` | `string` |

The internals of the `Stopwatch` resource behave very similarly to the `Now` resource. The main difference is that the `Stopwatch` resource returns the time as a formatted string.

From the perspective of the code that uses the stopwatch, the return value is a normal reactive string.

## Reusing the `Now` Resource in `Stopwatch`

You might be thinking that `Stopwatch` reimplements a whole bunch of `Now`, and you ought to be able to just use `Now` directly inside of `Stopwatch`.

You'd be right!

```js
const formatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hour12: false,
});

const Stopwatch = resource(({ use }) => {
  const time = use(Now);

  return () => formatter.format(time.current);
});
```

<details><summary>In Starbeam</summary>

```js
const formatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hour12: false,
});

const Stopwatch = Resource(({ use }) => {
  const time = use(Now);

  return Formula(() => formatter.format(time.current));
});
```

</details>

The `Stopwatch` resource instantiated a `Now` resource using its use method. That automatically links the `Now` instance to the owner of the `Stopwatch`, which means that when the component that instantiated the stopwatch is unmounted, the interval will be cleaned up.

## Using a Resource to Represent an Open Channel

Resources can do more than represent data like a ticking clock. You can use a resource with any long-running process, as long as you can represent it meaningfully as a "current value".

<details><summany>Compared to other systems: Destiny of Unused Values</summary>

You might be thinking that resources sound a lot like other systems that convert long-running processes into a stream of values (such as observables).

While there are similarities between Resources and stream-based systems, there is an important distinction: because Resources only produce values on demand, they naturally ignore computing values that would never be used.

This includes values that would be superseded before they're used and values that would never be used because the resource was cleaned up before they were demanded.

**This means that resources are not appropriate if you need to fully compute values that aren't used by consumers.**

In stream-based systems, there are elaborate ways to use scheduling or lazy reducer patterns to get similar behavior. These approaches tend to be hard to understand and difficult to compose, because the rules are in a global scheduler, not the definition of the stream itself. These patterns also give rise to distinctions like "hot" and "cold" observables.

On the other hand, Starbeam Resources naturally avoid computing values that are never used by construction.

TL;DR Starbeam Resources do not represent a stream of values that you operate on using stream operators.

> **:key: Key Point** <br>
>Starbeam resources represent a single reactive value that is always up to date when demanded.

This also allows you to use Starbeam resources and other values interchangably in functions, and even pass them to functions that expect reactive values.

</details>

Let's take a look at an example of a resource that receives messages on a channel, and returns a string representing the last message it received.

In this example, the channel name that we're subscribing to is dynamic, and we want to unsubscribe from the channel whenever the channel name changes, but not when we get a new message.

```js
import { resourceFactory, resource, cell } from 'ember-resources';

function ChannelResource(channelName) {
  return resource(({ on }) => {
    const lastMessage = cell(null);

    const channel = Channel.subscribe(channelName);

    channel.onMessage((message) => {
      lastMessage.set(message);
    });

    on.cleanup(() => {
      channel.unsubscribe();
    });

    return () => {
      const prefix = `[${channelName}] `;
      if (lastMessage.current === null) {
        return `${prefix} No messages received yet`;
      } /*E1*/ else {
        return `${prefix} ${lastMessage.current}`;
      }
    };
  });
}
resourceFactory(ChannelResource);
```

To see this code in action, [checkout the live demo](https://limber.glimdown.com/edit?c=MQAgMglgtgRgpgJxAUQCYQC4HsEChcAicUWAdgM4YICGGEZIWAZiNSAEpzlYCuCAxnBAYAFrRAI4AB0nk4pDOWEihAIhKUJcQQpBQu5agHM4qrYIgA3OKkalWIAOpwYAZSz8A1nAwgAwmKkpHAANgB0%2BAAG0UYAVkohVnC40FI4vgDeWtx8ggBi1PzYCACeADTZvAJwFYIhISAAviBMCFhQIADkxPAIALSyVYLknQDc%2BAD0AFRTIAAKkhjytgHUQaEgqSHE8hi09PZMOCAwkpaYJSBTE7j8ZJqr6w0AvCAZuCAg5Dww5PwIEHgAC4QAAKfiBYIhABy1H0AEoQM8AHxvD6fEDbXz8aj1GCFTxKV4AbQAuuN0Z8JhMvtAeCFaEJJBZzqQjF8PN5fPpyIYTEopIh6OgcfUSpTMT5NgpEJZcUivj4AJIyhBykKg0GIlFojEYrGbWyvACytBEYTaPFIqFBptEFrWqHaWquIAAHAAGREAahAAEZxnrPgaQHwXiBIiIMBgpOQgdTyAB3ahSCBhVBwSwTFMQCYAEgyELWUNh%2Bka%2BYyEFQjUi%2BCDLR8ENBYfhEr1YVE8lBsjSFCEOp79zgYXiZC1rfrnw7KlIoNQtDYOvek4xopC%2BK85DCUBT4Nx64JSNRa43njnC7CpDhcHhE8njXhgYxjQqfo978fdYxiz49mXQbIY0DGMOAQVBJhSG1Y991PLcpB4cgRHAyCyjbUMKB%2BP4AWBMEoN1ScTwJIkQDJJ9634bZqAQFUljVXFQQgVV1U-etGglNjPjYtj8DuChfEeKFOByaoFUGXI4AKIocBKTUiyeUsbyPfCfwQewxOqTUsgYB8lP-T5eM0BlKCA3kQIVOoNVIekQhYiUDOxSENleATQjCb5fn%2BQE4HBRyYWvWy9TkqEwkA4CTE1Hk%2BUUpc0KMjATKityfFBSKQJY58AoxMgwgouA1h4KRNTwvTV18sIrXcrCvK1Mimkyz4VPsF0YvI%2B5fBkOAmAgAAPBVImJAsgtCBTGlJCNas%2BCAWFBOKEpAnK%2BEkXRnhWkArPqRESr1RqIwLDquu65poSwPQwq4cw4CSWwSh8SIJqaEBpmQP1rhAUI5Hw%2BsdsiPbJAO5oC1ms6FoQJaMBre6OOfJ8H3GWH8AAHiWKApAZJZkXRBH0EsL4MBKbZnlUGAcAzBAQT9KReu4RJUFGEApGoVB0DZcnJCgUZVAxvUMgyFyQiEoY1EFLBUdMRooYRiZsYxyXkdRxkMeiWsgA&format=glimdown)

<details><summary>In Starbeam</summary>

```js
import { Resource, Cell, Formula } from '@starbeam/universal';

function ChannelResource(channelName) {
  return Resource(({ on }) => {
    const lastMessage = Cell(null);

    const channel = Channel.subscribe(channelName.read());

    channel.onMessage((message) => {
      lastMessage.set(message);
    });

    on.cleanup(() => {
      channel.unsubscribe();
    });

    return Formula(() => {
      const prefix = `[${channelName.read()}] `;
      if (lastMessage.current === null) {
        return `${prefix} No messages received yet`;
      } /*E1*/ else {
        return `${prefix} ${lastMessage.current}`;
      }
    });
  });
}
```

</details>

`ChannelResource` is a JavaScript function that takes the channel name as a reactive input and returns a resource constructor.

That resource constructor starts by subscribing to the current value of the `channelName`, and then telling Ember to unsubscribe from the channel when the resource is cleaned up.

It then creates a cell that holds the last message it received on the channel, and returns a function that returns that message as a formatted string (or a helpful message if the channel hasn't received any messages yet).

At this point, let's take a look at the dependencies:

```mermaid
flowchart LR
    ChannelResource-->channelName
    subgraph ChannelResource
    lastMessage
    end
    output-->channelName
    output-->lastMessage

    style channelName fill:#8888ff,color:white
    style output fill:#8888ff,color:white
    style lastMessage fill:#8888ff,color:white
```

Our output depends on the channel name and the last message received on that channel. The lastMessage depends on the channel name as well, and whenever the channel name changes, the resource is cleaned up and the channel is unsubscribed.

If we receive a new message, the lastMessage cell is set to the new message. This invalidates lastMessage and therefore the output as well.

```mermaid
flowchart LR
    ChannelResource-->channelName
    subgraph ChannelResource
    lastMessage
    end
    output-->channelName
    output-->lastMessage

    style channelName fill:#8888ff,color:white
    style output fill:#ff8888,color:black
    style lastMessage fill:#ff8888,color:black
```

However, this does not invalidate the resource itself, so the channel subscription remains active.

On the other hand, if we change the channelName, that invalidates the ChannelResource itself.

```mermaid
flowchart LR
    ChannelResource-->channelName
    subgraph ChannelResource
    lastMessage
    end
    output-->channelName
    output-->lastMessage

    style channelName fill:#ff8888,color:black
    style output fill:#ff8888,color:black
    style lastMessage fill:#ff8888,color:black

```

As a result, the resource will be cleaned up and the channel unsubscribed. After that, the resource will be re-created from the new channelName, and the process will continue.


> **:key: Key Point** <br> From the perspective of the creator of a resource, the resource represents a stable reactive value.

<details><summary>Under the hood</summary>

Under the hood, the internal `ChannelResource` instance is cleaned up and recreated whenever its inputs change. However, the resource you got back when you created it remains the same.
</details>


----------------------------------------

Previous: [Introduction](./README.md)
Next: [Usage in Ember](./ember.md)




[^starbeam]: These docs have been adapted from the [Starbeam](https://www.starbeamjs.com/guides/fundamentals/resources.html) docs on Resources.

[^copying]: while ~90% of the content is copied, adjustments have been made for casing of APIs, as well as omissions / additions as relevant to the ember ecosystem right now. Starbeam is focused on _Universal Reactivity_, which in documentation for Ember, we don't need to focus on in this document. Also, mega huge thanks to [@wycats](https://github.com/wycats) who wrote most of this documentation. I, `@nullvoxpopuli`, am often super stressed by documentation writing (at least when stakes are high) -- I am much happier/relaxed writing code, and getting on the same page between our two projects.
