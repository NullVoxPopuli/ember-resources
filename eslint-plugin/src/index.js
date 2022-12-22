'use strict';

module.exports = {
  rules: {
    'no-this-property-assignment-in-resource-thunk': require('./rules/no-this-property-assignment-in-resource-thunk.js'),
    'no-this-property-assignment-in-tracked-function': require('./rules/no-this-property-assignment-in-tracked-function.js'),
    'no-this-property-assignment-in-function-resource': require('./rules/no-this-property-assignment-in-function-resource.js'),
  },
  configs: {
    recommended: require('./config/recommended'),
  },
};
