/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import test from 'tape-cup';
import App, {createPlugin, createToken} from 'fusion-core';
import {collectDependencyData} from '../collectDependencyData.js';

test('collectDependencyData', t => {
  const app = new App();

  const V = createToken('V');
  const A = createToken('A');
  const B = createToken('B');
  const C = createToken('C');

  const APlugin = createPlugin({});
  const BPlugin = createPlugin({deps: {a: A}});
  const CPlugin = createPlugin({
    provides() {
      return 1;
    },
  });

  app.register(V, null);
  app.register(A, APlugin);
  app.register(B, BPlugin);
  app.register(C, CPlugin);
  app.enhance(C, () => 2);

  const data = collectDependencyData(app);

  const ssr = data.dependencies.find(d => d.name === 'SSRDeciderToken');
  if (ssr) {
    t.equal(typeof ssr.stack, 'string', 'SSRDeciderToken has stack');
    t.equal(ssr.name, 'SSRDeciderToken', 'SSRDeciderToken has correct name');
    t.deepEqual(ssr.dependencies, [], 'SSRDeciderToken has correct deps');
  } else t.fail('should find SSRDeciderToken');

  const v = data.dependencies.find(d => d.name === 'V');
  if (v) {
    t.equal(typeof v.stack, 'string', 'V has stack');
    t.equal(v.name, 'V', 'V has correct name');
    t.deepEqual(v.dependencies, [], 'V has correct deps');
  } else t.fail('should find V');

  const a = data.dependencies.find(d => d.name === 'A');
  if (a) {
    t.equal(typeof a.stack, 'string', 'A has stack');
    t.equal(a.name, 'A', 'A has correct name');
    t.deepEqual(a.dependencies, [], 'A has correct deps');
  } else t.fail('should find A');

  const b = data.dependencies.find(d => d.name === 'B');
  if (b) {
    t.equal(typeof b.stack, 'string', 'B has stack');
    t.equal(b.name, 'B', 'B has correct name');
    t.deepEqual(b.dependencies, ['A'], 'B has correct deps');
  } else t.fail('should find B');

  const c = data.dependencies.find(d => d.name === 'C');
  if (c) {
    t.equal(typeof c.stack, 'string', 'C has stack');
    t.equal(c.name, 'C', 'C has correct name');
    t.deepEqual(c.dependencies, [], 'C has correct deps');
  } else t.fail('should find C');

  t.deepEqual(data.enhanced, [{name: 'C'}], 'C is enhanced');

  t.end();
});
