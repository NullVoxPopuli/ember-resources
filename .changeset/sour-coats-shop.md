---
"ember-resources": patch
---

The `keepLatest` utility previously incorrectly had a `| undefined` type for the return value.
That's been removed.

`| undefined` is still a valid type if the passed value is possibly `| undefined`.
This made the `| undefined` on `keepLatest` redundant.
