'use strict';

const { localName } = require('../utils');

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    docs: {
      recommended: true,
      category: 'side-effects',
    },
    messages: {
      noSideEffects:
        'Resources are meant to be encapsulated values with cleanup. Side-effects are not allowed.',
    },
  },
  create(context) {
    let trackedFunctionName;
    let lastCallStack = [];

    return {
      ...localName(
        'ember-resources/util/function',
        'trackedFunction',
        (name) => (trackedFunctionName = name)
      ),
      CallExpression(node) {
        if (node.callee.name !== trackedFunctionName) return;

        lastCallStack.push(node);
      },
      'CallExpression:exit'(node) {
        if (node.callee.name !== trackedFunctionName) return;

        lastCallStack.pop();
      },
      'AssignmentExpression[left.object.type="ThisExpression]'(node) {
        if (lastCallStack.length > 0) {
          context.report({
            node: node,
            message: 'noSideEffects',
          });
        }
      },
    };
  },
};
