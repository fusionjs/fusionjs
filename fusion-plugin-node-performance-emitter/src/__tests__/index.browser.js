/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */
import test from 'tape-cup';

import App, {createToken} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';

import NodePerformanceEmitterPlugin from '../browser';

const MockPluginToken = createToken('test-plugin-token');
function createTestFixture() {
  const app = new App('content', el => el);
  app.register(MockPluginToken, NodePerformanceEmitterPlugin);
  return app;
}

test('exported as expected', t => {
  t.ok(NodePerformanceEmitterPlugin, 'plugin defined as expected');
  t.equal(typeof NodePerformanceEmitterPlugin, 'object', 'plugin is an object');
  t.end();
});

test('plugin resolution not supported on browser', t => {
  const app = createTestFixture();
  t.throws(() => getSimulator(app));
  t.end();
});
