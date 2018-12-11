/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const path = require('path');
const t = require('assert');

const {Compiler} = require('../../build/compiler');

module.exports = function testEnvs(title /*: string */, dir /*: string */) {
  testDev(`${title} dev`, dir);
  testProd(`${title} prod`, dir);
};

function testDev(title, dir) {
  test(
    title,
    async () => {
      const env = 'development';
      const entryPath = `.fusion/dist/${env}/server/server-main.js`;
      const entry = path.resolve(dir, entryPath);

      const compiler = new Compiler({env, dir});
      await compiler.clean();

      const compilationError = await new Promise(resolve => {
        compiler.start((err, stats) => {
          if (err || stats.hasErrors()) {
            return resolve(err || new Error('Compiler stats included errors.'));
          }

          return resolve(false);
        });
      });

      t.ok(compilationError, 'Should produce compilation error');
      // $FlowFixMe
      t.throws(() => require(entry), 'Should throw');
    },
    100000
  );
}
function testProd(title, dir) {
  test(
    title,
    async () => {
      const env = 'production';
      const entryPath = `.fusion/dist/${env}/server/server-main.js`;
      const entry = path.resolve(dir, entryPath);

      const compiler = new Compiler({env, dir});
      await compiler.clean();

      const compilationError = await new Promise(resolve => {
        compiler.start((err, stats) => {
          if (err || stats.hasErrors()) {
            return resolve(err || new Error('Compiler stats included errors.'));
          }

          return resolve(false);
        });
      });

      t.ok(compilationError, 'Should produce compilation error');

      // $FlowFixMe
      t.throws(() => require(entry), 'Should throw');
    },
    100000
  );
}
