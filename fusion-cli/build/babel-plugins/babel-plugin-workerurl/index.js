/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const createNamedModuleVisitor = require('../babel-plugin-utils/visit-named-module');

module.exports = workerURLPlugin;

function workerURLPlugin(babel /*: Object */) {
  const t = babel.types;
  const visitor = createNamedModuleVisitor(
    t,
    'workerUrl',
    'fusion-core',
    refsHandler
  );
  return {visitor};
}

function refsHandler(t, context, refs = []) {
  refs.forEach((refPath) => {
    const parentPath = refPath.parentPath;
    if (!t.isCallExpression(parentPath)) {
      return;
    }
    const args = parentPath.get('arguments');
    if (args.length !== 1) {
      throw parentPath.buildCodeFrameError(
        'workerURL takes a single string literal argument'
      );
    }
    if (!t.isStringLiteral(args[0])) {
      throw parentPath.buildCodeFrameError(
        'workerURL argument must be a string literal'
      );
    }
    args[0].replaceWith(
      t.callExpression(t.identifier('require'), [
        t.stringLiteral(`__SECRET_WORKER_LOADER__!${args[0].node.value}`),
      ])
    );
  });
}
