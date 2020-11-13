/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import fs from 'fs';
import path from 'path';
import util from 'util';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

const readDir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

test('DIErrors within fusion-core all correspond to markdown documents', async () => {
  const srcDir = path.resolve('src');
  const srcFiles = await recursiveReadDir(srcDir);
  const docReferences = [];
  const visitor = createDocumentVisitor(doc => docReferences.push(doc));
  for (const file of srcFiles) {
    if (path.extname(file) !== '.js') continue;
    const code = await readFile(file, 'utf-8');
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['flow', 'classProperties'],
    });
    traverse(ast, visitor);
  }
  expect(docReferences.length).not.toBe(0);
  const markdownFiles = (await readDir('../errors')).map(file =>
    file.replace(/\.md$/, '')
  );
  expect(markdownFiles.length).not.toBe(0);

  // Error docs will not be deleted when an error is obviated/removed, so
  // markdown files will always be a superset including current error references
  docReferences.forEach(docRef => {
    expect(markdownFiles).toContain(docRef);
  });
});

async function recursiveReadDir(dir) {
  const files = await readDir(dir, {withFileTypes: true});
  return [].concat(
    ...(await Promise.all(
      files.map(file => {
        const resolved = path.resolve(dir, file.name);
        if (file.isDirectory()) {
          return recursiveReadDir(resolved);
        } else {
          return resolved;
        }
      })
    ))
  );
}

function createDocumentVisitor(callback) {
  return {
    ImportDeclaration(path) {
      // import {DIError} from '../stack-trace.js';
      const DIError = path.node.specifiers.find(sp => {
        const importPath = path.node.source.value;
        return (
          sp.imported &&
          sp.imported.name === 'DIError' &&
          /stack-trace/.test(importPath)
        );
      });
      if (!DIError) return;
      const uses = path.scope.bindings[DIError.local.name].referencePaths;
      for (const usage of uses) {
        if (t.isNewExpression(usage.parent)) {
          if (
            !usage.parent.arguments ||
            usage.parent.arguments.length !== 1 ||
            !t.isObjectExpression(usage.parent.arguments[0])
          ) {
            throw new Error(
              'DIError invocation must have options object passed as only argument'
            );
          }
          let doc = usage.parent.arguments[0].properties.find(prop => {
            return prop.key.name === 'errorDoc';
          });
          if (!doc) {
            // Some errors won't have docs
            continue;
          }
          doc = doc.value;
          if (!t.isStringLiteral(doc)) {
            throw new Error('DIError document must be a string literal');
          }
          callback(doc.value);
        } else {
          throw new Error(`DIError must be invoked with 'new' operator`);
        }
      }
    },
  };
}
