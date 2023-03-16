---
"ember-resources": patch
---

When using RemoteData, isError should be true when the http status code is >= 400. Resolves #825".
Previously, when you had a JSON response with 404 status code, `isError` would be false instead of true.
