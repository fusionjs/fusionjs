/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const _fs = require('fs');
const path = require('path');
const createNamedModuleVisitor = require('../babel-plugin-utils/visit-named-module');

module.exports = function gqlPlugin(babel /*: Object */, state /*: Object */) {
  const fs = state.fs || _fs;
  const inline = state.inline;
  const t = babel.types;
  const visitor = createNamedModuleVisitor(
    t,
    'gql',
    'fusion-apollo',
    refsHandler
  );
  return {visitor};

  function refsHandler(t, context, refs = [], specifierName) {
    refs.forEach(refPath => {
      const parentPath = refPath.parentPath;
      if (!t.isCallExpression(parentPath)) {
        return;
      }
      const args = parentPath.get('arguments');
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
      if (inline) {
        const contents = fs
          .readFileSync(
            path.resolve(
              path.dirname(context.file.opts.filename),
              args[0].node.value
            )
          )
          .toString();

        parentPath.replaceWith(
          t.callExpression(
            t.callExpression(t.identifier('require'), [
              t.stringLiteral('graphql-tag'),
            ]),
            [t.stringLiteral(contents)]
          )
        );
      } else {
        parentPath.replaceWith(
          t.callExpression(t.identifier('require'), [
            t.stringLiteral(`__SECRET_GQL_LOADER__!${args[0].node.value}`),
          ])
        );
      }
    });
  }
};
