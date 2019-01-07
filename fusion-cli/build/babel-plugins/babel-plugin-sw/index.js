/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const createNamedModuleVisitor = require('../babel-plugin-utils/visit-named-module');

module.exports = chunkPathsPlugin;

function chunkPathsPlugin(babel /*: Object */) {
  const t = babel.types;
  const visitor = createNamedModuleVisitor(
    t,
    'swTemplate',
    'fusion-cli/sw',
    refsHandler
  );
  return {visitor};
}

function refsHandler(t, context, refs = [], _, specifier) {
  const declaration = specifier.parentPath;
  declaration.set('source', t.stringLiteral('__SECRET_SW_LOADER__!'));
}
