/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const t = require('assert');
const {transform} = require('@babel/core');

const createNamedModuleVisitor = require('../visit-named-module');
const replaceImportDeclaration = require('../replace-import-declaration');

function createTestPlugin(handler) {
  return babel => {
    const visitor = createNamedModuleVisitor(
      babel.types,
      'foo',
      'bar',
      handler
    );
    return {visitor};
  };
}

test('with flow types', () => {
  const plugin = createTestPlugin((types, context, refs) => {
    t.equal(refs.length, 1);
    t.ok(types.isCallExpression(refs[0].parent));
  });

  transform(
    `
    import {foo} from 'bar';
    import type {footype} from 'bar';
    let baz: string = foo();
  `,
    {
      plugins: [require('@babel/plugin-transform-flow-strip-types'), plugin],
    }
  );
});

test('import case', () => {
  const plugin = createTestPlugin((types, context, refs) => {
    t.equal(refs.length, 1);
    t.ok(types.isCallExpression(refs[0].parent));
  });

  transform(
    `
    import {foo, baz} from 'bar';

    const notfoo = bar;
    console.log(foo);
  `,
    {plugins: [plugin]}
  );
});

test('replace import declaration from named module with variable declarations', () => {
  const plugin = babel => {
    const visitor = replaceImportDeclaration(babel.types, 'bar');
    return {visitor};
  };

  const transformed = transform(`import {propOne, propTwo} from 'bar'`, {
    plugins: [plugin],
  });

  t.equal(
    transformed.code,
    `const propOne = SECRET_PROP_ONE_GLOBAL;
const propTwo = SECRET_PROP_TWO_GLOBAL;`
  );

  const notTransformed = transform(`import { propOne, propTwo } from 'baz';`, {
    plugins: [plugin],
  });

  t.equal(notTransformed.code, `import { propOne, propTwo } from 'baz';`);
});
