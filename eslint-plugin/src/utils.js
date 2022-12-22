'use strict';

function localName(importPath, specifierName, callback) {
  return {
    [`ImportDeclaration[source.value="${importPath}"] ` +
      `> ImportSpecifier[imported.name="${specifierName}"]`](node) {
      callback(node.local.name);
    },
  };
}

function functionBodyOfArguments(args) {
  for (let arg of args) {
    switch (arg.type) {
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        return arg.body.body;
    }
  }
}

module.exports = {
  localName,
  functionBodyOfArguments,
};
