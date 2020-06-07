/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import type {Reducer, StoreEnhancer} from 'redux';
import {JSDOM} from 'jsdom';

import App, {consumeSanitizedHTML, createPlugin, unescape} from 'fusion-core';
import type {FusionPlugin} from 'fusion-core';
import {getSimulator, getService} from 'fusion-test-utils';

import {deserialize} from '../src/codec.js';

import Redux from '../src/index.js';
import {
  EnhancerToken,
  PreloadedStateToken,
  ReducerToken,
  GetInitialStateToken,
  ReduxToken,
} from '../src/tokens.js';

/* Test fixtures */
const appCreator = (reducer, preloadedState, getInitialState, enhancer) => {
  const app = new App('test', el => el);
  if (reducer) {
    app.register(ReducerToken, reducer);
  }
  if (preloadedState) {
    app.register(PreloadedStateToken, preloadedState);
  }
  if (getInitialState) {
    app.register(GetInitialStateToken, getInitialState);
  }
  if (enhancer) {
    app.register(EnhancerToken, enhancer);
  }
  return () => app;
};

test('interface', async done => {
  const ctx = {memoized: new Map()};
  const reducer = (state, action) => ({test: action.payload || 1});
  const redux = getService(appCreator(reducer), Redux).from((ctx: any));

  expect.assertions(2);
  if (!redux.initStore) {
    done();
    return;
  }
  const store = await redux.initStore();

  expect(store.getState().test).toBe(1);
  store.dispatch({type: 'CHANGE', payload: 2});
  expect(store.getState().test).toBe(2);
  done();
});

test('non-ssr routes', async done => {
  const reducer = (state, action) => ({test: action.payload || 1});
  const plugin = getService(appCreator(reducer), Redux);
  let mockCtx = {
    body: null,
    memoized: new Map(),
  };

  expect.assertions(1);
  if (!Redux.middleware) {
    done();
    return;
  }

  // $FlowFixMe
  await Redux.middleware(null, plugin)((mockCtx: any), () => Promise.resolve());
  expect(plugin.from((mockCtx: any)).store).toBeFalsy();
  done();
});

test('getInitialState', async done => {
  const reducer = (state = {}, action) => ({
    ...state,
    test: action.payload || 1,
  });
  const mockCtx = {mock: true, memoized: new Map()};
  const getInitialState: any = async ctx => {
    expect(ctx).toBe(mockCtx);
    return {hello: 'world'};
  };
  const preloadedState = {a: 'b'};
  const redux = getService(
    appCreator(reducer, preloadedState, getInitialState),
    Redux
  ).from((mockCtx: any));

  expect.assertions(6);
  if (!redux.initStore) {
    done();
    return;
  }

  const store = await redux.initStore();

  expect(store.getState().test).toBe(1);
  expect(store.getState().hello).toBe('world');
  expect(store.getState().a).toBe('b');
  store.dispatch({type: 'CHANGE', payload: 2});
  expect(store.getState().test).toBe(2);
  expect(store).toBe(await (redux.initStore && redux.initStore()));
  done();
});

test('enhancers', async done => {
  const mockCtx: any = {mock: true, memoized: new Map()};
  const myEnhancer = createStore => (...args) => {
    const store = createStore(...args);
    // $FlowFixMe
    expect(store.ctx).toBe(mockCtx);
    return store;
  };
  const reducer = s => s;
  const redux = getService(
    appCreator(reducer, null, null, myEnhancer),
    Redux
  ).from(mockCtx);

  expect.assertions(2);
  if (!redux.initStore) {
    done();
    return;
  }

  const store = await redux.initStore();
  expect(store.ctx).toBe(mockCtx);
  done();
});

const testEnhancer = async (
  done,
  enhancer: StoreEnhancer<*, *, *> | FusionPlugin<*, StoreEnhancer<*, *, *>>
): Promise<void> => {
  const app = new App('el', el => el);
  const mockReducer: Reducer<*, *> = s => s;

  app.register(EnhancerToken, enhancer);
  app.register(ReducerToken, mockReducer);
  app.register(ReduxToken, Redux);

  const testPlugin = createPlugin({
    deps: {
      redux: ReduxToken,
    },
    middleware({redux}) {
      return async (ctx, next) => {
        const reduxScoped = redux.from(ctx);

        if (!reduxScoped.initStore) {
          // $FlowFixMe
          done.fail();
          return;
        }

        const store = await reduxScoped.initStore();
        // $FlowFixMe
        expect(store.mock).toBe(true);

        return next();
      };
    },
  });
  app.register(testPlugin);

  const simulator = getSimulator(app);
  await simulator.render('/');
};

test('enhancers - via app.register', async done => {
  /* Enhancer function */
  const myEnhancer: StoreEnhancer<*, *, *> = createStore => (...args) => {
    const store = createStore(...args);
    // $FlowFixMe
    store.mock = true;
    return store;
  };
  await testEnhancer(done, myEnhancer);

  /* Enhancer plugin */
  const myEnhancerPlugin: FusionPlugin<
    *,
    StoreEnhancer<*, *, *>
  > = createPlugin({
    provides() {
      return myEnhancer;
    },
  });
  await testEnhancer(done, myEnhancerPlugin);
  done();
});

test('serialization', async done => {
  const reducer = (state, action) => ({
    test: action.payload || 1,
    xss: '</div>',
  });
  const element = React.createElement('div');
  const ctx: any = {element, template: {body: []}, memoized: new Map()};
  const Plugin = getService(appCreator(reducer), Redux);

  expect.assertions(5);
  if (!Redux.middleware) {
    done();
    return;
  }

  // $FlowFixMe
  await Redux.middleware(null, Plugin)(ctx, () => Promise.resolve());

  expect(Plugin.from(ctx).store).toBeTruthy();
  expect(ctx.element).not.toBe(element);
  expect(ctx.template.body.length).toBe(1);
  // $FlowFixMe
  expect(consumeSanitizedHTML(ctx.template.body[0]).match('test')[0]).toBe(
    'test'
  );
  expect(consumeSanitizedHTML(ctx.template.body[0]).match('</div>')).toBe(null);
  done();
});

test('serialization and deserialization', async done => {
  // A redux state with encoded chars
  const obj = {
    backslashes: '\\u0026',
    crazy_combo: 'zz%5C%\\25aa%%%%asdf\\u0026%25asdf%5C%\\a%25%%25',
  };

  const reducer = (state, action) => obj;
  const element = React.createElement('div');
  const ctx: any = {element, template: {body: []}, memoized: new Map()};
  const Plugin = getService(appCreator(reducer), Redux);

  expect.assertions(4);
  if (!Redux.middleware) {
    done();
    return;
  }

  // $FlowFixMe
  await Redux.middleware(null, Plugin)(ctx, () => Promise.resolve());

  expect(Plugin.from(ctx).store).toBeTruthy();
  expect(ctx.element).not.toBe(element);
  expect(ctx.template.body.length).toBe(1);

  const body = consumeSanitizedHTML(ctx.template.body[0]);
  const dom = new JSDOM(`<!DOCTYPE html>${body}`);

  const content = dom.window.document.getElementById('__REDUX_STATE__')
    .textContent;
  expect(deserialize(unescape(content))).toStrictEqual(obj);

  done();
});
