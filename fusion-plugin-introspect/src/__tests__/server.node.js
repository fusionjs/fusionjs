/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import test from 'tape-cup';
import App, {createToken, createPlugin} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';
import plugin from '../server.js';

test('server plugin', async t => {
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
  t.equal(data.server[0].dependencies.constructor, Array, 'has server key');
  t.equal(data.runtime.constructor, Object, 'has runtime key');
  t.equal(data.runtime.pid.constructor, Number, 'has runtime meta data');
  t.equal(data.runtime.varNames.constructor, Array, 'has env vars');

  await sim.request('/_diagnostics', {method: 'POST', body: {foo: 1}});
  await sim.request('/_diagnostics', {method: 'POST', body: {foo: 2}});
  t.equal(data.browser[0].foo, 1, 'has browser key');
  t.equal(data, store, 'consumes DI service correctly');
  t.end();
});

test('required arg', t => {
  // $FlowFixMe prevent flow nag when testing that missing required arg throws...
  t.throws(() => plugin(), 'app is required');
  t.end();
});
