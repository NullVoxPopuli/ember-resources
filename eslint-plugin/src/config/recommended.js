'use strict';

module.exports = {
  plugins: ['ember-resources'],
  rules: {
    'ember-resources/no-this-property-assignment-in-resource-thunk': ['error', {}],
    'ember-resources/no-this-property-assignment-in-tracked-function': ['error', {}],
    'ember-resources/no-this-property-assignment-in-function-resource': ['error', {}],
  },
};
