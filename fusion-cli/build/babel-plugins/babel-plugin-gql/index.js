/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const createNamedModuleVisitor = require('../babel-plugin-utils/visit-named-module');

module.exports = function gqlPlugin(babel /*: Object */, state /*: Object */) {
  const t = babel.types;
  const visitor = createNamedModuleVisitor(
    t,
    'gql',
    ['fusion-apollo', 'fusion-plugin-apollo'],
    refsHandler
  );
  return {visitor};

  function refsHandler(t, context, refs = [], specifierName) {
    refs.forEach(refPath => {
      const parentPath = refPath.parentPath;
      if (t.isSequenceExpression(parentPath)) {
        const callExpression = parentPath.node.expressions.find(
          n => n.type === 'CallExpression'
        );
        const args = callExpression.arguments;
        validateArgs(args, parentPath);
        parentPath.node.expressions = parentPath.node.expressions.map(p => {
          if (p === callExpression) {
            return getReplacementPath(args);
          }
        });
      } else if (t.isCallExpression(parentPath)) {
        const args = parentPath.node.arguments;
        validateArgs(args, parentPath);
        parentPath.replaceWith(getReplacementPath(args));
      }
    });
    function validateArgs(args, parentPath) {
      if (args.length !== 1) {
        throw parentPath.buildCodeFrameError(
          'gql takes a single string literal argument'
        );
      }
      if (!t.isStringLiteral(args[0])) {
        throw parentPath.buildCodeFrameError(
          'gql argument must be a string literal'
        );
      }
    }

    function getReplacementPath(args) {
      const arg = args[0].value;
      return t.callExpression(t.identifier('require'), [t.stringLiteral(arg)]);
    }
  }
};
