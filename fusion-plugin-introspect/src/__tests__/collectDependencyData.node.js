/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import App, {createPlugin, createToken} from 'fusion-core';
import {collectDependencyData} from '../collectDependencyData.js';

test('collectDependencyData', () => {
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
    expect(ssr.sources instanceof Array).toBe(true);
    expect(ssr.name).toBe('SSRDeciderToken');
    expect(ssr.dependencies).toEqual([]);
  } else throw new Error('should find SSRDeciderToken');

  const v = data.dependencies.find(d => d.name === 'V');
  if (v) {
    expect(v.sources instanceof Array).toBe(true);
    expect(v.name).toBe('V');
    expect(v.type).toBe('value');
    expect(v.dependencies).toEqual([]);
  } else throw new Error('should find V');

  const a = data.dependencies.find(d => d.name === 'A');
  if (a) {
    expect(a.sources instanceof Array).toBe(true);
    expect(a.name).toBe('A');
    expect(a.type).toBe('noop');
    expect(a.dependencies).toEqual([]);
  } else throw new Error('should find A');

  const b = data.dependencies.find(d => d.name === 'B');
  if (b) {
    expect(b.sources instanceof Array).toBe(true);
    expect(b.name).toBe('B');
    expect(b.type).toBe('noop');
    expect(b.dependencies).toEqual(['A']);
  } else throw new Error('should find B');

  const c = data.dependencies.find(d => d.name === 'C');
  if (c) {
    expect(c.sources instanceof Array).toBe(true);
    expect(c.name).toBe('C');
    expect(c.type).toBe('service');
    expect(c.dependencies).toEqual([]);
  } else throw new Error('should find C');
});
