/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import App, {createToken, createPlugin} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';
import plugin from '../server.js';

test('server plugin', async () => {
  let store;
  const StorageToken = createToken('Storage');
  const StorageService = createPlugin({
    provides() {
      return data => (store = data);
    },
  });

  const app = new App(' ', v => v);
  let data = {};
  app.register(StorageToken, StorageService);
  app.register(
    plugin(app, {
      deps: {save: StorageToken},
      store: {
        storeSync(args) {
          data = args;
        },
        async store(args, {save}) {
          data = args;
          save(data);
        },
      },
    })
  );
  const sim = getSimulator(app);
  await sim.render('/');
  expect(data.server[0].dependencies.constructor).toBe(Array);
  expect(data.runtime.constructor).toBe(Object);
  expect(data.runtime.pid.constructor).toBe(Number);
  expect(data.runtime.varNames.constructor).toBe(Array);

  await sim.request('/_diagnostics', {method: 'POST', body: {foo: 1}});
  await sim.request('/_diagnostics', {method: 'POST', body: {foo: 2}});
  expect(data.browser[0].foo).toBe(1);
  expect(data).toBe(store);
});

test('required arg', () => {
  // $FlowFixMe prevent flow nag when testing that missing required arg throws...
  expect(() => plugin()).toThrow();
});
