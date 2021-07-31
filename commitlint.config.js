'use strict';

module.exports = {
 extends: ['@commitlint/config-conventional'],
  // https://commitlint.js.org/#/reference-rules
  // Level [0..2]: 0 disables the rule. For 1 it will be considered a warning for 2 an error.
  // Applicable always|never: never inverts the rule.
  // Value: value to use for this rule.
  rules: {
    // 72, the default, is a little short
    "header-max-length": [1, "always", 100],
    // Let people use caps
    "header-case": [0],
    // Let people write  sentences
    "header-full-stop": [0],
    "subject-case": [0],
  }
}
