import tape from 'tape-cup';
import React from 'react';
import Redux from '../index.js';
import {consumeSanitizedHTML} from 'fusion-core';

tape('interface', async t => {
  const ctx = {memoized: new Map()};
  const reducer = (state, action) => ({test: action.payload || 1});
  const redux = Redux.provides({reducer}).from(ctx);
  const store = await redux.initStore();

  t.equals(store.getState().test, 1, 'state is accessible');
  store.dispatch({type: 'CHANGE', payload: 2});
  t.equals(store.getState().test, 2, 'state receives dispatch');
  t.end();
});

tape('non-ssr routes', async t => {
  const reducer = (state, action) => ({test: action.payload || 1});
  const plugin = Redux.provides({reducer});
  let ctx = {
    body: null,
    memoized: new Map(),
  };
  await Redux.middleware(null, plugin)(ctx, () => Promise.resolve());
  t.notok(plugin.from(ctx).store);
  t.end();
});

tape('getInitialState', async t => {
  const reducer = (state = {}, action) => ({
    ...state,
    test: action.payload || 1,
  });
  const mockCtx = {mock: true, memoized: new Map()};
  const redux = Redux.provides({
    reducer,
    preloadedState: {a: 'b'},
    async getInitialState(ctx) {
      t.equal(ctx, mockCtx);
      return {hello: 'world'};
    },
  }).from(mockCtx);
  const store = await redux.initStore();

  t.equals(store.getState().test, 1, 'state is accessible');
  t.equal(store.getState().hello, 'world');
  t.equal(store.getState().a, 'b');
  store.dispatch({type: 'CHANGE', payload: 2});
  t.equals(store.getState().test, 2, 'state receives dispatch');
  t.equal(store, await redux.initStore(), 'memoization works');
  t.end();
});

tape('enhancers', async t => {
  const mockCtx = {mock: true, memoized: new Map()};
  const myEnhancer = createStore => (...args) => {
    const store = createStore(...args);
    t.equals(store.ctx, mockCtx, '[Enhancer] ctx provided by ctxEnhancer');
    return store;
  };
  const redux = Redux.provides({reducer: s => s, enhancer: myEnhancer}).from(
    mockCtx
  );
  const store = await redux.initStore();
  t.equals(store.ctx, mockCtx, '[Final store] ctx provided by ctxEnhancer');
  t.end();
});

tape('serialization', async t => {
  const reducer = (state, action) => ({
    test: action.payload || 1,
    xss: '</div>',
  });
  const element = React.createElement('div');
  const ctx = {element, template: {body: []}, memoized: new Map()};
  const Plugin = Redux.provides({reducer});
  await Redux.middleware(null, Plugin)(ctx, () => Promise.resolve());
  t.ok(Plugin.from(ctx).store);
  t.notEquals(ctx.element, element, 'wraps provider');
  t.equals(ctx.template.body.length, 1, 'pushes serialization to body');
  t.equals(consumeSanitizedHTML(ctx.template.body[0]).match('test')[0], 'test');
  t.equals(consumeSanitizedHTML(ctx.template.body[0]).match('</div>'), null);
  t.end();
});
