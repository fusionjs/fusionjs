/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const snakeCase = require('just-snake-case');

module.exports = replaceImportDeclaration;

/*
  Before:
  import {syncChunkPaths, allChunkPaths} from 'fusion-core';

  After:
  const syncChunkPaths = SECRET_SYNC_CHUNK_PATHS_GLOBAL;
  const allChunkPaths = SECRET_ALL_CHUNK_PATHS_GLOBAL;
*/
function replaceImportDeclaration(
  t /*: Object */,
  packageName /*: string | Array<string> */
) {
  return {
    ImportDeclaration(path /*: Object */) {
      const sourceName = path.get('source').node.value;
      if (
        (Array.isArray(packageName) &&
          packageName.indexOf(sourceName) === -1) ||
        (typeof packageName === 'string' && sourceName !== packageName)
      ) {
        return;
      }

      path.replaceWithMultiple(
        path.get('specifiers').map(specifier => {
          const specifierName = specifier.get('imported').node.name;
          return t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier(specifierName),
              t.identifier(
                'SECRET_' + snakeCase(specifierName).toUpperCase() + '_GLOBAL'
              )
            ),
          ]);
        })
      );
    },
  };
}
