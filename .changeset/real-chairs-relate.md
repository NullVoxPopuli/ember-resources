---
"ember-resources": patch
---

When using the `resourceFactory` (blueprint in [Starbeam][docs-starbeam] terms),
there was an issue where a returned `resource` would not get torn down when the
surrounding context of the `resourceFactory` would get torn down.

For example, in this situation,
which has been added as the [second example][demo-polling] on [this blog post][gts-examples],

```js
const poll = resourceFactory((fn, interval) => {
  return resource(({ on }) => {
    let x = setInterval(fn, interval);
    on.cleanup(() => clearInterval(x));
  });
});
```

usage would be:

```hbs
{{poll someFn someSeconds}}
```

So, when this was in an `if` statement, or in a component or route, or any content that could be torn down,
the `on.cleanup` callback would not be called.

This fix addresses the issue and the `on.cleanup` callback is now called.

NOTE: this approach to using resources is equivelent to this 0-dependency solution to polling:

```ts
import Component from "@glimmer/component";
import Helper from "@ember/component/helper";
import type RouterService from "@ember/routing/router-service";
import { service } from "@ember/service";

class Poll extends Helper {
  compute([fn, interval]: [(...args: unknown[]) => unknown, number]) {
    let x = setInterval(fn, interval);
    registerDestructor(this, () => clearInterval(x));
  }
}

export default class Demo extends Component {
  @service declare router: RouterService;

  poll = Poll;
  refreshData = () => this.router.refresh();
}
```

```hbs
{{this.poll this.refreshData 4000}}
```

[docs-starbeam]: https://www.starbeamjs.com
[gts-examples]: https://nullvoxpopuli.com/2022-09-05-gjs-cookbook-examples#polling
[demo-polling]: https://limber.glimdown.com/edit?format=glimdown&t=%23%20Polling%20data%0A%0AA%20common%20thing%20folks%20ask%20is%20to%20re-call%20%2F%20re-run%20the%20%5Broute%27s%20model%20hook%5D%5Broute-model%5D%20on%20some%20interval.%0A%0AThis%20technique%20can%20be%20used%20to%20poll%20anything%2C%20%0Anot%20just%20the%20%5Brouter%20service%5D%5Brouter-service%5D%27s%20%5B%60refresh%60%5D%5Brouter-refresh%5D%20method.%0AIt%20could%20be%20used%20for%20any%20function%2C%20%5B%60fetch%60%5D%5Bmdn-fetch%5D%2C%20plain%20old%20functions%2C%20etc.%0A%0AWhen%20polling%2C%20the%20most%20important%20thing%20to%20remember%20is%20that%20the%20polling%20function%20needs%20to%20be%20cancelled%20when%20the%20surrounding%20context%20is%20torn%20down%2C%20or%20if%20the%20app%20is%20destroyed.%20This%20is%20so%20that%20as%20you%20navigate%20within%20your%20app%2C%20or%20while%20running%20tests%2C%20a%20memory%20leak%20does%20not%20occur.%0A%0AThis%20approach%20uses%20%5B%60setInterval%60%5D%5Bmdn-setInterval%5D%20so%20as%20to%20not%20induce%20a%20%5B%60too%20much%20recursion%60%5D%5Bmdn-too-much-recursion%5D%20error.%0A%0A%5Brouter-service%5D%3A%20https%3A%2F%2Fapi.emberjs.com%2Fember%2Frelease%2Fclasses%2FRouterService%0A%5Brouter-refresh%5D%3A%20https%3A%2F%2Fapi.emberjs.com%2Fember%2F4.9%2Fclasses%2FRouterService%2Fmethods%2Frefresh%3Fanchor%3Drefresh%0A%5Broute-model%5D%3A%20https%3A%2F%2Fguides.emberjs.com%2Frelease%2Frouting%2Fspecifying-a-routes-model%2F%0A%5Bmdn-fetch%5D%3A%20https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FFetch_API%0A%5Bmdn-setInterval%5D%3A%20https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FsetInterval%0A%5Bmdn-too-much-recursion%5D%3A%20https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FJavaScript%2FReference%2FErrors%2FToo_much_recursion%0A%0A%60%60%60gjs%20live%20preview%0Aimport%20%7B%20on%20%7D%20from%20%27%40ember%2Fmodifier%27%3B%0Aimport%20%7B%20cell%2C%20resource%2C%20resourceFactory%20%7D%20from%20%27ember-resources%27%3B%0A%0Aconst%20show%20%3D%20cell(true)%3B%0Aconst%20pollCount%20%3D%20cell(0)%3B%0Aconst%20fetchData%20%3D%20()%20%3D%3E%20%7B%0A%20%20pollCount.current%2B%2B%3B%0A%20%20console.log(%27Fetching%20data%20(for%20pretend%20%2F%20example)%27)%3B%0A%7D%0Aconst%20ONE_SECOND%20%3D%201_000%3B%20%2F%2F%20ms%0A%0A%2F**********************************************************%0A%20*%20DEMO%20starts%20here%2C%20everything%20above%20is%20mostly%20irrelevant%0A%20**********************************************************%2F%0Aconst%20poll%20%3D%20resourceFactory((fn%2C%20interval)%20%3D%3E%20%7B%0A%20%20return%20resource((%7B%20on%20%7D)%20%3D%3E%20%7B%0A%20%20%20%20let%20x%20%3D%20setInterval(fn%2C%20interval)%3B%20%20%20%20%0A%20%20%20%20on.cleanup(()%20%3D%3E%20clearInterval(x))%3B%0A%20%20%7D)%3B%0A%7D)%3B%0A%0A%3Ctemplate%3E%0A%20%20Poll%20count%3A%20%7B%7BpollCount.current%7D%7D%3Cbr%3E%0A%20%20%3Cbutton%20%7B%7Bon%20%27click%27%20show.toggle%7D%7D%3EToggle%3C%2Fbutton%3E%3Cbr%20%2F%3E%0A%20%20%0A%20%20%7B%7B%23if%20show.current%7D%7D%0A%20%20%20%20%20Data%20is%20being%20polled.%0A%0A%20%20%20%20%20%7B%7Bpoll%20fetchData%20ONE_SECOND%7D%7D%0A%20%20%7B%7Belse%7D%7D%0A%20%20%20%20%20Polling%20is%20not%20occurring.%0A%20%20%7B%7B%2Fif%7D%7D%0A%0A%20%20%20%20%0A%3C%2Ftemplate%3E%0A%60%60%60
