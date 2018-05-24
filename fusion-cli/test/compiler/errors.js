/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const path = require('path');
const test = require('tape');

const {Compiler} = require('../../build/compiler');

testEnvs('missing module', 'test/fixtures/missing-module');
testEnvs('syntax error', 'test/fixtures/syntax-error');
testEnvs(
  'syntax error (colocated tests)',
  'test/fixtures/colocated-tests-error'
);

function testEnvs(title, dir) {
  testDev(`${title} dev`, dir);
  testProd(`${title} prod`, dir);
  testTest(`${title} test`, dir);
}

function testDev(title, dir) {
  test(title, async t => {
    const envs = ['development'];
    const entryPath = `.fusion/dist/${envs[0]}/server/server-main.js`;
    const entry = path.resolve(dir, entryPath);

    const compiler = new Compiler({envs, dir});
    await compiler.clean();

    const compilationError = await new Promise(resolve => {
      compiler.start((err, stats) => {
        if (err || stats.hasErrors()) {
          return resolve(err || new Error('Compiler stats included errors.'));
        }

        return resolve(false);
      });
    });

    t.assert(compilationError, 'Should produce compilation error');
    // $FlowFixMe
    t.throws(() => require(entry), 'Should throw');
    t.end();
  });
}
function testProd(title, dir) {
  test(title, async t => {
    const envs = ['production'];
    const entryPath = `.fusion/dist/${envs[0]}/server/server-main.js`;
    const entry = path.resolve(dir, entryPath);

    const compiler = new Compiler({envs, dir});
    await compiler.clean();

    const compilationError = await new Promise(resolve => {
      compiler.start((err, stats) => {
        if (err || stats.hasErrors()) {
          return resolve(err || new Error('Compiler stats included errors.'));
        }

        return resolve(false);
      });
    });

    t.assert(compilationError, 'Should produce compilation error');

    // $FlowFixMe
    t.throws(() => require(entry), 'Should throw');
    t.end();
  });
}
function testTest(title, dir) {
  test(title, async t => {
    const envs = ['test'];
    const entryPath = `.fusion/dist/${envs[0]}/server/server-main.js`;
    const entry = path.resolve(dir, entryPath);

    const compiler = new Compiler({envs, dir});
    await compiler.clean();

    const compilationError = await new Promise(resolve => {
      compiler.start((err, stats) => {
        if (err || stats.hasErrors()) {
          return resolve(err || new Error('Compiler stats included errors.'));
        }

        return resolve(false);
      });
    });

    t.assert(compilationError, 'Should produce compilation error');

    // $FlowFixMe
    t.throws(() => require(entry), 'Server test should throw');

    const clientDir = `.fusion/dist/${envs[0]}/client`;
    const clientEntry = path.resolve(clientDir, 'client-main.js');
    // $FlowFixMe
    t.throws(() => require(clientEntry), 'Client test should throw');

    t.end();
  });
}
