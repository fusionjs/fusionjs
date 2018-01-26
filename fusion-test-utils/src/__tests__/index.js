/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import test from 'tape-cup';
import App, {createPlugin} from 'fusion-core';
import {createToken} from 'fusion-tokens';

import {getSimulator, test as exportedTest} from '../index.js';

test('simulate render request', async t => {
  const flags = {render: false};
  const element = 'hi';
  const renderFn = () => {
    flags.render = true;
  };
  const app = new App(element, renderFn);
  var testApp = getSimulator(app);
  const ctx = await testApp.render('/');
  t.ok(flags.render, 'triggered ssr');
  t.ok(ctx.element, 'sets ctx.element');
  t.end();
});

test('simulate multi-render requests', async t => {
  const counter = {renderCount: 0};
  const renderFn = () => {
    counter.renderCount++;
  };
  const app = new App('hello', renderFn);
  var testApp = getSimulator(app);

  for (var i = 1; i <= 5; i++) {
    await testApp.render('/');
    t.equal(counter.renderCount, i, `#${i} ssr render successful`);
  }

  t.end();
});

test('simulate non-render request', async t => {
  const flags = {render: false};
  const element = 'hi';
  const renderFn = () => {
    flags.render = true;
  };
  const app = new App(element, renderFn);
  const testApp = getSimulator(app);
  if (__BROWSER__) {
    try {
      testApp.request('/');
      t.fail('should have thrown');
    } catch (e) {
      t.ok(e, 'throws an error');
    } finally {
      t.end();
    }
  } else {
    const ctx = testApp.request('/');
    t.notok(ctx.element, 'does not set ctx.element');
    t.ok(!flags.render, 'did not trigger ssr');
    t.end();
  }
});

test('use simulator with fixture and plugin dependencies', async t => {
  // Dependency-less plugin
  const msgProviderPluginToken = createToken('MessageProviderPluginToken');
  const msgProviderPlugin = createPlugin({
    provides() {
      return {msg: 'it works!'};
    },
  });
  function getTestFixture() {
    // Register plugins
    const app = new App('hi', el => el);
    app.register(msgProviderPluginToken, msgProviderPlugin);
    return app;
  }
  const app = getTestFixture();

  t.plan(3);
  getSimulator(
    app,
    createPlugin({
      deps: {msgProvider: msgProviderPluginToken},
      provides(deps) {
        t.ok(deps, 'some dependencies successfully resolved');
        t.ok(deps.msgProvider, 'requested dependency successfully resolved');
        const {msgProvider} = deps;
        t.equal(
          msgProvider.msg,
          msgProviderPlugin.provides().msg,
          'dependency payload is correct'
        );
        return 'yay!';
      },
    })
  );

  t.end();
});

test('test throws when not using test-app', async t => {
  try {
    exportedTest();
  } catch (e) {
    t.ok(
      e.message.includes('test-app'),
      'throws an error about running test-app'
    );
    t.end();
  }
});
