---
"ember-resources": patch
---

`trackedFunction`: Fix timing issue where updating tracked data consumed in `trackedFunction` would not re-cause the `isLoading` state to become `true` again.

Resolves #1010
