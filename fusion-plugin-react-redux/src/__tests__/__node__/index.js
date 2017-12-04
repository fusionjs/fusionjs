import tape from 'tape-cup';
import React from 'react';
import Redux from '../../index.js';
import {consumeSanitizedHTML} from 'fusion-core';

tape('interface', async t => {
  const reducer = (state, action) => ({test: action.payload || 1});
  const redux = Redux({reducer}).of();
  const store = await redux.initStore();

  t.equals(store.getState().test, 1, 'state is accessible');
  store.dispatch({type: 'CHANGE', payload: 2});
  t.equals(store.getState().test, 2, 'state receives dispatch');
  t.end();
});

tape('non-ssr routes', async t => {
  const reducer = (state, action) => ({test: action.payload || 1});
  const plugin = Redux({reducer});
  let ctx = {
    body: null,
  };
  await plugin.middleware(ctx, () => Promise.resolve());
  t.notok(plugin.of(ctx).store);
  t.end();
});

tape('getInitialState', async t => {
  const reducer = (state = {}, action) => ({
    ...state,
    test: action.payload || 1,
  });
  const redux = Redux({
    reducer,
    preloadedState: {a: 'b'},
    async getInitialState(ctx) {
      t.equal(ctx, 'test-ctx');
      return {hello: 'world'};
    },
  }).of();
  const store = await redux.initStore('test-ctx');

  t.equals(store.getState().test, 1, 'state is accessible');
  t.equal(store.getState().hello, 'world');
  t.equal(store.getState().a, 'b');
  store.dispatch({type: 'CHANGE', payload: 2});
  t.equals(store.getState().test, 2, 'state receives dispatch');
  t.equal(store, await redux.initStore('test-ctx'), 'memoization works');
  t.end();
});

tape('serialization', async t => {
  const reducer = (state, action) => ({
    test: action.payload || 1,
    xss: '</div>',
  });
  const element = React.createElement('div');
  const ctx = {element, body: {body: []}};
  const Plugin = Redux({reducer});
  await Plugin.middleware(ctx, () => Promise.resolve());
  t.ok(Plugin.of(ctx).store);
  t.notEquals(ctx.element, element, 'wraps provider');
  t.equals(ctx.body.body.length, 1, 'pushes serialization to body');
  t.equals(consumeSanitizedHTML(ctx.body.body[0]).match('test')[0], 'test');
  t.equals(consumeSanitizedHTML(ctx.body.body[0]).match('</div>'), null);
  t.end();
});
