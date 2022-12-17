# eslint-plugin-ember-resources

[![NPM version](https://img.shields.io/npm/v/eslint-plugin-ember-resources.svg?style=flat)](https://npmjs.org/package/eslint-plugin-ember-resources)
[![NPM downloads](https://img.shields.io/npm/dm/eslint-plugin-ember-resources.svg?style=flat)](https://npmjs.org/package/eslint-plugin-ember-resources)

> An ESlint plugin that provides set of rules enforcing consistent decorator positions

## ❗️Requirements

- [ESLint](https://eslint.org/) `>= 7`
- [Node.js](https://nodejs.org/) `>= 16`

## 🚀 Usage

### 1. Install plugin

```shell
yarn add --dev eslint-plugin-ember-resources
```

Or

```shell
npm install --save-dev eslint-plugin-ember-resources
```

### 2. Modify your `.eslintrc.js`

```javascript
// .eslintrc.js
module.exports = {
  parser: '@babel/eslint-parser',
  // parser: '@typescript-eslint/parser',
  plugins: ['ember-resources'],
  extends: [
    'plugin:ember-resources/ember' // or other configuration
  ],
  rules: {
    // override rule settings from extends config here
    // 'ember-resources/ember-resources': ['error', { /* your config */ }]
  }
};
```

## 🧰 Configurations

|    | Name | Description |
|:---|:-----|:------------|
| | [base](./src/config/base.js) | contains no rules settings, but the basic eslint configuration suitable for any project. You can use it to configure rules as you wish. |
| :hamster: | [ember](./src/config/ember.js) | extends the `base` configuration by enabling the recommended rules for ember projects. |

## 🍟 Rules

Rules are grouped by category to help you understand their purpose. Each rule has emojis denoting:

- What configuration it belongs to
- :wrench: if some problems reported by the rule are automatically fixable by the `--fix` [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) option

<!--RULES_TABLE_START-->

### undefined

|    | Rule ID | Description |
|:---|:--------|:------------|
| :white_check_mark: | [no-this-property-assignment-in-function-resource](./docs/rules/no-this-property-assignment-in-function-resource.md) | (no description) |
| :white_check_mark: | [no-this-property-assignment-in-resource-thunk](./docs/rules/no-this-property-assignment-in-resource-thunk.md) | (no description) |
| :white_check_mark: | [no-this-property-assignment-in-tracked-function](./docs/rules/no-this-property-assignment-in-tracked-function.md) | (no description) |

<!--RULES_TABLE_END-->

For the simplified list of rules, [go here](./src/index.js).

## 🍻 Contribution Guide

If you have any suggestions, ideas, or problems, feel free to [create an issue](https://github.com/NullVoxPopuli/eslint-plugin-ember-resources/issues/new), but first please make sure your question does not repeat [previous ones](https://github.com/NullVoxPopuli/eslint-plugin-ember-resources/issues).

### Creating a New Rule

- [Create an issue](https://github.com/NullVoxPopuli/eslint-plugin-ember-resources/issues/new) with a description of the proposed rule
- Create files for the [new rule](https://eslint.org/docs/developer-guide/working-with-rules):
  - `src/rules/new-rule.js` (implementation, see [no-proxies](src/rules/no-proxies.js) for an example)
  - `docs/rules/new-rule.md` (documentation, start from the template -- [raw](https://raw.githubusercontent.com/NullVoxPopuli/eslint-plugin-ember-resources/master/docs/rules/_TEMPLATE_.md), [rendered](docs/rules/_TEMPLATE_.md))
  - `tests/src/rules/new-rule.js` (tests, see [no-proxies](tests/src/rules/no-proxies.js) for an example)
- Run `yarn update` to automatically update the README and other files (and re-run this if you change the rule name or description)
- Make sure your changes will pass [CI](.travis.yml) by running:
  - `yarn test`
  - `yarn lint` (`yarn lint:js --fix` can fix many errors)
- Create a PR and link the created issue in the description

Note that new rules should not immediately be added to the [recommended](./src/recommended-rules.js) configuration, as we only consider such breaking changes during major version updates.

## SemVer Policy

How does this project interpret patch / minor / breaking changes?

- **patch**: a change that fixes currently broken behavior. Does not cause formatting to change when people update unless a previous patch/feature accidentally broke formatting in a **breaking** way.
- **minor**: a change that does not impact formatting
- **breaking**: a major change that is not backwards compatible and would intentionally cause formatting changes to occur

## 🔓 License

See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).
