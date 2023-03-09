---
"ember-resources": patch
---

`trackedTask` must return correct last value.

Fixes the issue described at #793
If the task was called multiple times and the last returned value was null or undefined,
then trackedTask will return the previous value instead of the current one.
