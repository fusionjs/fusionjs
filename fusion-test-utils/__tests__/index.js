/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import App, {createPlugin, createToken, memoize} from 'fusion-core';
import type {Token, FusionPlugin} from 'fusion-core';

import {getSimulator, getService, test as exportedTest} from '../src/index.js';

test('simulate render request', async () => {
  const flags = {render: false};
  const element = 'hi';
  const renderFn = () => {
    flags.render = true;
  };
  const app = new App(element, renderFn);
  var testApp = getSimulator(app);
  const ctx = await testApp.render('/');
  expect(flags.render).toBeTruthy();
  expect(ctx.element).toBeTruthy();
});

test('simulate multi-render requests', async () => {
  const counter = {renderCount: 0};
  const renderFn = () => {
    counter.renderCount++;
  };
  const app = new App('hello', renderFn);
  var testApp = getSimulator(app);

  for (var i = 1; i <= 5; i++) {
    await testApp.render('/');
    expect(counter.renderCount).toBe(i);
  }
});

test('simulate non-render request', async done => {
  const flags = {render: false};
  const element = 'hi';
  const renderFn = () => {
    flags.render = true;
  };
  const app = new App(element, renderFn);
  const testApp = getSimulator(app);
  if (__BROWSER__) {
    expect(() => testApp.request('/')).toThrow();
    done();
  } else {
    const ctx = await testApp.request('/');
    expect(ctx.element).toBeFalsy();
    expect(!flags.render).toBeTruthy();
    done();
  }
});

test('use simulator with fixture and plugin dependencies', async () => {
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

  expect.assertions(3);
  let testPlugin: FusionPlugin<*, *> = createPlugin({
    deps: {msgProvider: msgProviderPluginToken},
    provides(deps) {
      expect(deps).toBeTruthy();
      expect(deps.msgProvider).toBeTruthy();
      const {msgProvider} = deps;
      if (msgProviderPlugin.provides) {
        let provided = msgProviderPlugin.provides();
        expect(msgProvider.msg).toBe(provided.msg);
      }
      return 'yay!';
    },
  });
  getSimulator(app, testPlugin);
});

// Has to be skipped because this test relies on Jest globals not existing (i.e. tape)
test.skip('test throws when not using test-app', async done => {
  expect(exportedTest).toThrow('test-app');
  done();
});

test('getService - returns service as expected, with no dependencies', async () => {
  const simplePlugin = createPlugin({
    provides() {
      return {meaningOfLife: 42};
    },
  });

  const service = getService(() => new App('hi', el => el), simplePlugin);
  expect(service).toBeTruthy();
  expect(service.meaningOfLife).toBe(42);
});

test('getService - returns service as expected, with dependencies', async () => {
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

  const service = getService(() => {
    const app = new App('hi', el => el);
    app.register(meaningOfLifeToken, meaningOfLifePlugin);
    return app;
  }, simplePlugin);
  expect(service).toBeTruthy();
  expect(service.meaningOfLife).toBe(42);
});

test('getService - throws as expected due to missing dependency', async () => {
  const meaningOfLifeToken = createToken('meaning-of-life-token');
  const simplePlugin = createPlugin({
    deps: {meaning: meaningOfLifeToken},
    provides: ({meaning}) => {
      return {meaningOfLife: meaning};
    },
  });
  expect(() =>
    getService(() => new App('hi', el => el), simplePlugin)
  ).toThrow();
});

test('memoize helper', async () => {
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
          expect(self.from(ctx)).toBe(5);
          return next();
        };
      },
    })
  );
  const sim = getSimulator(app);
  await sim.render('/');
});
