# ember-addon-test

Test your v2 ember-addons with ease without any boilerplate files.

## Running Tests

In your addon's directory, run:

```bash
pnpm addon-test
```
or
```bash
yarn addon-test
```
or
```bash
npm exec addon-test
```

## Conventions

a file named `/tests/setup.ts` must exist so that your tests can be bootstrapped.

It should contain your test setup and import all your test files.
This is powered by [vite][gh-vite], so we can import all tests with one line.
Minimally, you'll want something like this:
```ts
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';

setup(QUnit.assert);

import.meta.glob('./**/*test.{js,ts}', { eager: true });
```

For adding types for `import.meta`, you'll need to install `vite` and
following [these instructions](vite-ts)


[gh-vite]: https://github.com/vitejs/vite/
[vite-ts]: https://vitejs.dev/guide/features.html#typescript

## Using your own vite.config.mts

mts is required because only ESM is supported. By default .ts files in node are converted to CJS, even if they use imports. Using the `mts` extension prevents this.

You can import the plugins provided by this library for your own vite config like this:
```ts
// vite.config.mts
import { defineConfig } from 'vite';
import { addonTest } from 'ember-addon-test';

export default defineConfig({
  plugins: [
    ...addonTest(),
  ],
});
```

## Testing against multiple ember versions / compiler settings

This is not supported at this time, ember-addon-test is still considered experimental,
and doesn't yet support swapping out the ember-source version (yet).
Testing against different ember versions is a great need for the entire ecosystem,
so this will be implemented eventually.
