# [3.0.0](https://github.com/NullVoxPopuli/ember-resources/compare/v2.0.1...v3.0.0) (2021-07-20)


### Features

* **functions:** all useFunction functions are now async ([01c6ffd](https://github.com/NullVoxPopuli/ember-resources/commit/01c6ffda29a0fcb02f722077aebc693413d6dd9f))


### BREAKING CHANGES

* **functions:** all functions async due to an issue that came up
during production builds, where minification would optimize away the
async/await when the function was a one liner, like:

```ts
async () => {
  return await ...
}
```
the `async` keyword was a clue to the `FunctionRunner` to go down a
different code branch (before running the function), but when the above
example function was minified, it became:

```ts
() => { return ... }
```

which then made the `FunctionRunner` go down the sync path, resulting
in the `value` being a promise, rather than the resolved value of the
promise.

## [2.0.1](https://github.com/NullVoxPopuli/ember-resources/compare/v2.0.0...v2.0.1) (2021-07-14)


### Bug Fixes

* **deps:** update dependency @ember/test-waiters to ^2.4.5 ([010dae3](https://github.com/NullVoxPopuli/ember-resources/commit/010dae3fabd81e3078c177714dc81d15a473523d))

# [2.0.0](https://github.com/NullVoxPopuli/ember-resources/compare/v1.3.1...v2.0.0) (2021-07-10)


### Features

* useFunction now supports an initialValue param ([6ba9e26](https://github.com/NullVoxPopuli/ember-resources/commit/6ba9e26b06409a80242d33c274343f653f131f61))


### BREAKING CHANGES

* useFunction is no longer an alias of useResource

## [1.3.1](https://github.com/NullVoxPopuli/ember-resources/compare/v1.3.0...v1.3.1) (2021-07-09)


### Bug Fixes

* **readme:** Correct example import of `useResource` ([5f99b22](https://github.com/NullVoxPopuli/ember-resources/commit/5f99b22aa7a3a04f3b8b1f638a257c11399094d8))

# [1.3.0](https://github.com/NullVoxPopuli/ember-resources/compare/v1.2.5...v1.3.0) (2021-06-25)


### Bug Fixes

* **readme:** table of contents links now work ([00a397f](https://github.com/NullVoxPopuli/ember-resources/commit/00a397f66a7617988af9a4d7f4c265ddb294962a))


### Features

* **types, docs:** document types and how to test with resources ([8545bb6](https://github.com/NullVoxPopuli/ember-resources/commit/8545bb65db7126a462826b7f8d2af149baa249a0))

## [1.2.5](https://github.com/NullVoxPopuli/ember-resources/compare/v1.2.4...v1.2.5) (2021-06-24)


### Bug Fixes

* **async functions:** properly entangle for the value and prevent infinite re-rendering ([ad268fe](https://github.com/NullVoxPopuli/ember-resources/commit/ad268feb9c420058c7c7219ca6da3f15bfce359f))

## [1.2.4](https://github.com/NullVoxPopuli/ember-resources/compare/v1.2.3...v1.2.4) (2021-06-24)


### Bug Fixes

* **types:** add type visibility to the FunctionRunner to keep private ([e051be9](https://github.com/NullVoxPopuli/ember-resources/commit/e051be9cbda6798a1327d2f4bfbbfab5540ad7ec))
* when an async function resolves, auto-tracking should do stuff ([6504660](https://github.com/NullVoxPopuli/ember-resources/commit/6504660e6abde1a78034432a7b9777d4a5afafdb))

## [1.2.3](https://github.com/NullVoxPopuli/ember-resources/compare/v1.2.2...v1.2.3) (2021-06-23)


### Bug Fixes

* **lifecycle:** support resources without a setup method ([d11e6fc](https://github.com/NullVoxPopuli/ember-resources/commit/d11e6fc9210e6ef2184730ba28205b285e90713b))

## [1.2.2](https://github.com/NullVoxPopuli/ember-resources/compare/v1.2.1...v1.2.2) (2021-06-17)


### Bug Fixes

* **deps:** update dependency ember-cli-typescript to ^4.2.1 ([7a987a0](https://github.com/NullVoxPopuli/ember-resources/commit/7a987a073b7d16df77da0a95e4a7495b63632a42))

## [1.2.1](https://github.com/NullVoxPopuli/ember-resources/compare/v1.2.0...v1.2.1) (2021-06-17)


### Bug Fixes

* **deps:** update dependency ember-cli-typescript to ^4.2.0 ([ad65662](https://github.com/NullVoxPopuli/ember-resources/commit/ad65662a1c7f55679c2652ef210c0e8c1361fc35))

# [1.2.0](https://github.com/NullVoxPopuli/ember-resources/compare/v1.1.0...v1.2.0) (2021-06-06)


### Bug Fixes

* **readme:** useTask is no longer coming soon -- it's here ([d9e85b6](https://github.com/NullVoxPopuli/ember-resources/commit/d9e85b6b9d5fd577c994887ff36deea809fe0e47))


### Features

* add useTask ([8637477](https://github.com/NullVoxPopuli/ember-resources/commit/8637477ba74f0f0b34579663b9493838ddc09358))

# [1.1.0](https://github.com/NullVoxPopuli/ember-resources/compare/v1.0.0...v1.1.0) (2021-06-06)


### Features

* make addon not private (oops) ([97eb257](https://github.com/NullVoxPopuli/ember-resources/commit/97eb257e750c2aa0d033ef0c0843cd91fe3510a8))

# 1.0.0 (2021-06-06)


### Bug Fixes

* embroider support ([330e4c2](https://github.com/NullVoxPopuli/ember-resources/commit/330e4c2d3296cb4e4ea1c87d2daff47d5e7f522d))


### Features

* function resources ([fff7e0b](https://github.com/NullVoxPopuli/ember-resources/commit/fff7e0bfb4a197449edf3a03de32869d1245db47))
* implement HelperManager ([82f258a](https://github.com/NullVoxPopuli/ember-resources/commit/82f258a169b6c3ddc7978373df9eb4122599c9d6))
* the LifecycleResource has its first passing test ([cef4396](https://github.com/NullVoxPopuli/ember-resources/commit/cef439639c6effce7f5a03326840b466903e23c4))
