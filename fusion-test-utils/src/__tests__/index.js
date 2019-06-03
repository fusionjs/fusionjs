/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import App, {createPlugin, createToken, memoize} from 'fusion-core';
import type {Token, FusionPlugin} from 'fusion-core';

import {getSimulator, getService, test as exportedTest} from '../index.js';

test('simulate render request', async t => {
  const flags = {render: false};
  const element = 'hi';
  const renderFn = () => {
    flags.render = true;
  };
  const app = new App(element, renderFn);
  var testApp = await getSimulator(app);
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
  var testApp = await getSimulator(app);

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
  const testApp = await getSimulator(app);
  if (__BROWSER__) {
    try {
      await testApp.request('/');
      t.fail('should have thrown');
    } catch (e) {
      t.ok(e, 'throws an error');
    } finally {
      t.end();
    }
  } else {
    const ctx = await testApp.request('/');
    t.notok(ctx.element, 'does not set ctx.element');
    t.ok(!flags.render, 'did not trigger ssr');
    t.end();
  }
});

test('use simulator with fixture and plugin dependencies', async t => {
  // Dependency-less plugin
  type MessageType = {
    msg: string,
  };
  const msgProviderPluginToken: Token<MessageType> = createToken(
    'MessageProviderPluginToken'
  );
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
  let testPlugin: FusionPlugin<*, *> = createPlugin({
    deps: {msgProvider: msgProviderPluginToken},
    provides(deps) {
      t.ok(deps, 'some dependencies successfully resolved');
      t.ok(deps.msgProvider, 'requested dependency successfully resolved');
      const {msgProvider} = deps;
      if (msgProviderPlugin.provides) {
        t.equal(
          msgProvider.msg,
          msgProviderPlugin.provides().msg,
          'dependency payload is correct'
        );
      }
      return 'yay!';
    },
  });
  await getSimulator(app, testPlugin);

  t.end();
});

test('test throws when not using test-app', async t => {
  try {
    //$FlowFixMe
    exportedTest();
  } catch (e) {
    t.ok(
      e.message.includes('test-app'),
      'throws an error about running test-app'
    );
    t.end();
  }
});

test('getService - returns service as expected, with no dependencies', async t => {
  const simplePlugin = createPlugin({
    provides() {
      return {meaningOfLife: 42};
    },
  });

  const service = await getService(() => new App('hi', el => el), simplePlugin);
  t.ok(service);
  t.equal(service.meaningOfLife, 42);

  t.end();
});

test('getService - returns service as expected, with dependencies', async t => {
  const meaningOfLifeToken = createToken('meaning-of-life-token');
  const meaningOfLifePlugin = createPlugin({
    provides() {
      return 42;
    },
  });
  const simplePlugin = createPlugin({
    deps: {meaning: meaningOfLifeToken},
    provides: ({meaning}) => {
      return {meaningOfLife: meaning};
    },
  });

  const service = await getService(() => {
    const app = new App('hi', el => el);
    app.register(meaningOfLifeToken, meaningOfLifePlugin);
    return app;
  }, simplePlugin);
  t.ok(service);
  t.equal(service.meaningOfLife, 42);

  t.end();
});

test('getService - throws as expected due to missing dependency', async t => {
  const meaningOfLifeToken = createToken('meaning-of-life-token');
  const simplePlugin = createPlugin({
    deps: {meaning: meaningOfLifeToken},
    provides: ({meaning}) => {
      return {meaningOfLife: meaning};
    },
  });

  try {
    await getService(() => new App('hi', el => el), simplePlugin);
    t.fail('should not reach here');
  } catch (e) {
    // no-op
  }
  t.end();
});

test('memoize helper', async t => {
  const app = new App('hi', el => el);
  app.register(
    createPlugin({
      provides: () => {
        return {
          from: memoize(ctx => {
            return 5;
          }),
        };
      },
      middleware: (deps, self) => {
        return (ctx, next) => {
          t.equal(self.from(ctx), 5);
          return next();
        };
      },
    })
  );
  const sim = await getSimulator(app);
  await sim.render('/');
  t.end();
});
