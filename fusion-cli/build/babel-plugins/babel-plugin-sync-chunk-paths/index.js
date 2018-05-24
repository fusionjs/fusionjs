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
    'syncChunkPaths',
    'fusion-core',
    refsHandler
  );
  return {visitor};
}

function refsHandler(t, context, refs = []) {
  refs.forEach(refPath => {
    const parentPath = refPath.parentPath;
    if (!t.isCallExpression(parentPath)) {
      return;
    }
    const args = parentPath.get('arguments');
    if (args.length !== 0) {
      throw parentPath.buildCodeFrameError('syncChunkPaths takes no arguments');
    }
    // eslint-disable-next-line no-console
    parentPath.set('arguments', [
      t.callExpression(t.identifier('require'), [
        t.stringLiteral('__SECRET_SYNC_CHUNK_PATHS_LOADER__!'),
      ]),
    ]);
  });
}
