---
"eslint-plugin-ember-resources": major
---

Inpsired by this [Issue Report](https://github.com/NullVoxPopuli/ember-resources/issues/707),
thanks, [@swastik](https://github.com/swastik)!!

There is now an ESLint plugin to help with usage of resources to help prevent common footguns.

- `no-this-property-assignment-in-tracked-function`
  prevents assigning properties on `this` when a `trackedFunction` is embedded within another class.
- `no-this-property-assignment-in-function-resource`
  same as the above but for `resource({ })`
- `no-this-property-assignment-in-resource-thunk`
  in the same spirit of https://github.com/ember-cli/eslint-plugin-ember/blob/master/docs/rules/no-side-effects.md

To Setup this plugin, install it, and then setup your `.eslintrc.js`:

```javascript
// .eslintrc.js
module.exports = {
  // ...
  plugins: ["ember-resources"],
  extends: ["plugin:ember-resources/recommended"],
  // ...
};
```
