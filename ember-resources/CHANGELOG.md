# [4.0.0](https://github.com/NullVoxPopuli/ember-resources/compare/v3.2.4...v4.0.0) (2021-11-01)


### Features

* **readme:** declare ember-auto-import compatibility ([2701891](https://github.com/NullVoxPopuli/ember-resources/commit/2701891d342c91ce4bd9159c4f9d61732d5fc902))


### BREAKING CHANGES

* **readme:** ember-auto-import compatibility was not declared.

If any projects that previously used ember-auto-import@1,
this addon will no longer work for those projects until those projects
upgrade to either ember-auto-import@v2 or embroider.

This breaking change is to communicate the accidental compatibility
breaking with older projects. The last available version projects
without ember-auto-import@v2 can use is v3.2.2.

I'm declaring this an accidental breakage soley because compatibility
was not previosuly declared and any compatibliity with older projects
may as well have been "accidental".

For projects that already were using ember-auto-import@v2, there is no
breaking change. There is no behavioral difference in this addon's
features.

However, embroider and ember-auto-import@v2 users will no longer have
ember-resources count against their build times as V2 Addons are
pre-built during publish.

If you have any questions, feel free to open an issue at:
https://github.com/NullVoxPopuli/ember-resources/issues

## [3.2.4](https://github.com/NullVoxPopuli/ember-resources/compare/v3.2.3...v3.2.4) (2021-11-01)


### Bug Fixes

* **internal:** use correct config for the tooling lints ([7e6e8a4](https://github.com/NullVoxPopuli/ember-resources/commit/7e6e8a4e31d176dfc89b70c092a5b3b495a13112))

## [3.2.3](https://github.com/NullVoxPopuli/ember-resources/compare/v3.2.2...v3.2.3) (2021-10-31)


### Bug Fixes

* **readme:** specify v2 format ([3f6bb1b](https://github.com/NullVoxPopuli/ember-resources/commit/3f6bb1b63c748f1e57b9f9463ae9c4f471f8808d))

## [3.2.2](https://github.com/NullVoxPopuli/ember-resources/compare/v3.2.1...v3.2.2) (2021-10-19)


### Bug Fixes

* **deps:** update dependency ember-cli-htmlbars to v6 ([07465ab](https://github.com/NullVoxPopuli/ember-resources/commit/07465ab4372fd93543d1117e2a15da8ad894ad83))

## [3.2.1](https://github.com/NullVoxPopuli/ember-resources/compare/v3.2.0...v3.2.1) (2021-09-05)


### Bug Fixes

* **types:** useResource types now reflect that you *can* make non-reactive resources ([9059c90](https://github.com/NullVoxPopuli/ember-resources/commit/9059c904d3eb082a244c4bbc306b186e2e665458)), closes [#48](https://github.com/NullVoxPopuli/ember-resources/issues/48)

# [3.2.0](https://github.com/NullVoxPopuli/ember-resources/compare/v3.1.3...v3.2.0) (2021-08-29)


### Bug Fixes

* **useFunction, typescript:** you may now specify a return type without specifying the args type ([fe0acff](https://github.com/NullVoxPopuli/ember-resources/commit/fe0acff308d1aa11c0e1933ba18e7bd538e19d2b))


### Features

* **readme:** document and test how would would compose useFunction ([cbc99c0](https://github.com/NullVoxPopuli/ember-resources/commit/cbc99c0782c2f8d94bfe19644f8cdeabc936aac7))
* **useHelper:** can now reactively invoke helpers from JS ([b51f10f](https://github.com/NullVoxPopuli/ember-resources/commit/b51f10fcc2fd9d0cd27ac8319325198ee3142a00))

## [3.1.3](https://github.com/NullVoxPopuli/ember-resources/compare/v3.1.2...v3.1.3) (2021-08-18)


### Bug Fixes

* **deps:** update dependency @ember/test-waiters to v3 ([47571ee](https://github.com/NullVoxPopuli/ember-resources/commit/47571eeb5c1ae28ffb4bbd6f30a7ce8338ed323a))

## [3.1.2](https://github.com/NullVoxPopuli/ember-resources/compare/v3.1.1...v3.1.2) (2021-08-03)


### Bug Fixes

* **types:** loosen the args type on the lifecycle resource ([56f96b0](https://github.com/NullVoxPopuli/ember-resources/commit/56f96b040488f7ee0a5b4c6cd4b6d03255186d73))

## [3.1.1](https://github.com/NullVoxPopuli/ember-resources/compare/v3.1.0...v3.1.1) (2021-08-01)


### Bug Fixes

* **108:** ensure that Args can be ommitted from Resources when unknown is ok ([34c07ff](https://github.com/NullVoxPopuli/ember-resources/commit/34c07fffd809cf3c89ae85650c4e3f36d58a7d01))
* **issue#108:** loosen the constraint on what named arguments are ([dff5be3](https://github.com/NullVoxPopuli/ember-resources/commit/dff5be3cef53bbee9c4c74cf8cceed72638bf78a)), closes [issue#108](https://github.com/issue/issues/108)

# [3.1.0](https://github.com/NullVoxPopuli/ember-resources/compare/v3.0.1...v3.1.0) (2021-07-31)


### Features

* **resource:** Resource without lifecycle hooks ([ae0656f](https://github.com/NullVoxPopuli/ember-resources/commit/ae0656fa45a5abf540efcb75699740b126e6638f))

## [3.0.1](https://github.com/NullVoxPopuli/ember-resources/compare/v3.0.0...v3.0.1) (2021-07-25)


### Bug Fixes

* **readme:** all code samples now include imports from ember-resources ([d7941f4](https://github.com/NullVoxPopuli/ember-resources/commit/d7941f4db22dd2457a4004f59aa0a15c167419a1)), closes [#87](https://github.com/NullVoxPopuli/ember-resources/issues/87)

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
