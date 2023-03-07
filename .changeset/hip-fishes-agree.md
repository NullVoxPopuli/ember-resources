---
"ember-resources": minor
---

Add link() and @link, importable from `ember-resources/link`.

NOTE: for existing users of `ember-resources`, this addition has no impact on your bundle.

<details><summary>Example property usage</summary>

```js
import { link } from 'ember-resources/link';

class MyClass {  ... }

export default class Demo extends Component {
  // This usage does now allow passing args to `MyClass`
  @link(MyClass) myInstance;
}
```

</details>

<details><summary>Example inline usage</summary>

```js
import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { link } from 'ember-resources/link';

export default class Demo extends Component {
  // To pass args to `MyClass`, you must use this form
  // NOTE though, that `instance` is linked to the `Demo`s lifecycle.
  //  So if @foo is changing frequently, memory pressure will increase rapidly
  //  until the `Demo` instance is destroyed.
  // 
  //  Resources are a better fit for this use case, as they won't add to memory pressure.
  @cached
  get myFunction() {
    let instance = new MyClass(this.args.foo);

    return link(instance, this);
  }
}
```

</details>


This abstracts away the following boilerplate:
```js 
import { getOwner, setOwner } from '@ember/owner';
import { associateDestroyableChild } from '@ember/destroyable';

class MyClass { /* ... */ }

export default class Demo extends Component {
  @cached 
  get myInstance() {
    let instance = new MyClass();
    
    associateDestroyableChild(this, instance);
    
    let owner = getOwner(this);

    if (owner) {
      setOwner(instance, owner);
    }

    return instance;
  }
}
```

