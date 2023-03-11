---
"ember-resources": major
---

The `RemoteData` resource now has the same state changes and semantics as `trackedFunction`.

Breaking Changes:

- `isResolved` is only true when the request succeeds. During migration, you may use `isFinished` for previous behavior.
