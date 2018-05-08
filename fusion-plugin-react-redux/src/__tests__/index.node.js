/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import tape from 'tape-cup';
import React from 'react';
import type {Reducer, StoreEnhancer} from 'redux';

import App, {consumeSanitizedHTML, createPlugin} from 'fusion-core';
import type {FusionPlugin} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';

import Redux from '../index.js';
import {EnhancerToken, ReducerToken, ReduxToken} from '../tokens.js';

tape('interface', async t => {
  const ctx = {memoized: new Map()};
  const reducer = (state, action) => ({test: action.payload || 1});
  const redux = Redux && Redux.provides({reducer}).from((ctx: any));

  t.plan(2);
  if (!redux.initStore) {
    t.end();
    return;
  }
  const store = await redux.initStore();

  t.equals(store.getState().test, 1, 'state is accessible');
  store.dispatch({type: 'CHANGE', payload: 2});
  t.equals(store.getState().test, 2, 'state receives dispatch');
  t.end();
});

tape('non-ssr routes', async t => {
  const reducer = (state, action) => ({test: action.payload || 1});
  const plugin = Redux.provides({reducer});
  let mockCtx = {
    body: null,
    memoized: new Map(),
  };

  t.plan(1);
  if (!Redux.middleware) {
    t.end();
    return;
  }

  await Redux.middleware(null, plugin)((mockCtx: any), () => Promise.resolve());
  t.notok(plugin.from((mockCtx: any)).store);
  t.end();
});

tape('getInitialState', async t => {
  const reducer = (state = {}, action) => ({
    ...state,
    test: action.payload || 1,
  });
  const mockCtx = {mock: true, memoized: new Map()};
  const getInitialState: any = async ctx => {
    t.equal(ctx, mockCtx);
    return {hello: 'world'};
  };
  const redux = Redux.provides({
    reducer,
    preloadedState: {a: 'b'},
    getInitialState,
  }).from((mockCtx: any));

  t.plan(6);
  if (!redux.initStore) {
    t.end();
    return;
  }

  const store = await redux.initStore();

  t.equals(store.getState().test, 1, 'state is accessible');
  t.equal(store.getState().hello, 'world');
  t.equal(store.getState().a, 'b');
  store.dispatch({type: 'CHANGE', payload: 2});
  t.equals(store.getState().test, 2, 'state receives dispatch');
  t.equal(
    store,
    await (redux.initStore && redux.initStore()),
    'memoization works'
  );
  t.end();
});

tape('enhancers', async t => {
  const mockCtx: any = {mock: true, memoized: new Map()};
  const myEnhancer = createStore => (...args) => {
    const store = createStore(...args);
    // $FlowFixMe
    t.equals(store.ctx, mockCtx, '[Enhancer] ctx provided by ctxEnhancer');
    return store;
  };
  const redux = Redux.provides({reducer: s => s, enhancer: myEnhancer}).from(
    mockCtx
  );

  t.plan(2);
  if (!redux.initStore) {
    t.end();
    return;
  }

  const store = await redux.initStore();
  t.equals(store.ctx, mockCtx, '[Final store] ctx provided by ctxEnhancer');
  t.end();
});

const testEnhancer = async (
  t: tape$Context,
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
          t.fail();
          t.end();
          return;
        }

        const store = await reduxScoped.initStore();
        // $FlowFixMe
        t.equals(store.mock, true, '[Final store] ctx provided by ctxEnhancer');

        return next();
      };
    },
  });
  app.register(testPlugin);

  const simulator = getSimulator(app);
  await simulator.render('/');
};

tape('enhancers - via app.register', async t => {
  /* Enhancer function */
  const myEnhancer: StoreEnhancer<*, *, *> = createStore => (...args) => {
    const store = createStore(...args);
    // $FlowFixMe
    store.mock = true;
    return store;
  };
  await testEnhancer(t, myEnhancer);

  /* Enhancer plugin */
  const myEnhancerPlugin: FusionPlugin<
    *,
    StoreEnhancer<*, *, *>
  > = createPlugin({
    provides() {
      return myEnhancer;
    },
  });
  await testEnhancer(t, myEnhancerPlugin);

  t.end();
});

tape('serialization', async t => {
  const reducer = (state, action) => ({
    test: action.payload || 1,
    xss: '</div>',
  });
  const element = React.createElement('div');
  const ctx: any = {element, template: {body: []}, memoized: new Map()};
  const Plugin = Redux.provides({reducer});

  t.plan(5);
  if (!Redux.middleware) {
    t.end();
    return;
  }

  await Redux.middleware(null, Plugin)(ctx, () => Promise.resolve());

  t.ok(Plugin.from(ctx).store);
  t.notEquals(ctx.element, element, 'wraps provider');
  t.equals(ctx.template.body.length, 1, 'pushes serialization to body');
  // $FlowFixMe
  t.equals(consumeSanitizedHTML(ctx.template.body[0]).match('test')[0], 'test');
  t.equals(consumeSanitizedHTML(ctx.template.body[0]).match('</div>'), null);
  t.end();
});
