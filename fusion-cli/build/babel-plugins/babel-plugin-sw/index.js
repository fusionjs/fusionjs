/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const replaceImportDeclaration = require('../babel-plugin-utils/replace-import-declaration');

module.exports = swPlugin;

function swPlugin(babel /*: Object */) {
  const t = babel.types;
  const visitor = replaceImportDeclaration(t, 'fusion-core');
  return {visitor};
}
