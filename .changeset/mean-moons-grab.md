---
"ember-resources": patch
---

Fixes [#835](https://github.com/NullVoxPopuli/ember-resources/issues/835) - resolves regression introduced by [PR: #808 ](https://github.com/NullVoxPopuli/ember-resources/pull/808) which aimed to correctly return the _previous_ task instance's value if the _current task_ hasn't finished yet. The regression described by #835 was that if a task in cancelled (e.g.: dropped), it is considered finished, and that canceled task's value would be used instead of the last compuleted task. In normal ember-concurrency APIs, this is abstracted over via the `.lastSuccessful` property on the `TaskProperty`. The goal of the `.value` on `trackedTask` is to mimic the property chain: `taskProperty.lastSuccessful?.value`.

