---
"ember-resources": patch
---

Improve contribution resistance by removing semantic-release/commits and switching to
[Changesets](https://github.com/changesets/) for managing automatic release.

The release automation and human intervention is just the right mix of both
to make everything painless for all parties.

This means:

- contributors don't need to "adhere to the commit convention" - which was linted for and had no autofix
- a preview PR will be created so folks can see what all is going in to a release
- releases can be bundled, meaning not every commit going in to `main` needs to be releasable
  - this allows for simultaneous batches of breaking changes, and would have prevented some early churn in this package's history
- and most importantly, changelogs are meant for humans (not machines), and Changeset allows for human-focused changelogs

I'll be moving all of my addons to Changesets and away from semantic-release.
