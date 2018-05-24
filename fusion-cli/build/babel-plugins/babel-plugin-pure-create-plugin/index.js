/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const createNamedModuleVisitor = require('../babel-plugin-utils/visit-named-module');

module.exports = pureCreatePlugin;

function pureCreatePlugin(babel /*: Object */) {
  const t = babel.types;
  const visitor = createNamedModuleVisitor(
    t,
    'createPlugin',
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
    parentPath.addComment('leading', '#__PURE__');
    if (parentPath.parentPath.type === 'ExportDefaultDeclaration') {
      const id = parentPath.parentPath.scope.generateUidIdentifier('default');
      parentPath.parentPath.insertBefore(
        t.variableDeclaration('var', [
          t.variableDeclarator(id, parentPath.parentPath.node.declaration),
        ])
      );
      parentPath.parentPath.node.declaration = id;
    }
  });
}
