/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import tape from 'tape-cup';
import Enzyme, {mount} from 'enzyme';
import {connect} from 'react-redux';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';

import type {Context} from 'fusion-core';

import GetReduxPlugin from '../browser.js';

Enzyme.configure({adapter: new Adapter()});

tape('browser with no preloadedState and no __REDUX_STATE__ element', t => {
  const Redux = GetReduxPlugin();
  const reducer = (state, action) => {
    return {
      ...state,
      test: action.payload || 1,
    };
  };
  const provider = Redux.provides({reducer});
  const {store} = provider && provider.from();
  t.deepLooseEqual(store.getState(), {test: 1});
  store.dispatch({type: 'CHANGE', payload: 2});
  t.equals(store.getState().test, 2, 'state receives dispatch');
  t.end();
});

tape('browser with preloadedState and no __REDUX_STATE__ element', t => {
  const Redux = GetReduxPlugin();
  const reducer = (state, action) => {
    return {
      ...state,
      test: action.payload || 1,
    };
  };
  const {store} = Redux.provides({
    reducer,
    preloadedState: {hello: 'world'},
  }).from();
  t.deepLooseEqual(store.getState(), {test: 1, hello: 'world'});
  store.dispatch({type: 'CHANGE', payload: 2});
  t.deepLooseEqual(store.getState(), {test: 2, hello: 'world'});
  t.end();
});

tape('browser with no preloadedState and a __REDUX_STATE__ element', t => {
  const Redux = GetReduxPlugin();
  const reduxState = document.createElement('script');
  reduxState.setAttribute('type', 'application/json');
  reduxState.setAttribute('id', '__REDUX_STATE__');
  reduxState.textContent = JSON.stringify({hello: 'world'});
  document.body && document.body.appendChild(reduxState);
  const reducer = (state, action) => {
    return {
      ...state,
      test: action.payload || 1,
    };
  };
  const {store} = Redux.provides({reducer}).from();
  t.deepLooseEqual(store.getState(), {test: 1, hello: 'world'});
  store.dispatch({type: 'CHANGE', payload: 2});
  t.deepLooseEqual(store.getState(), {test: 2, hello: 'world'});
  document.body && document.body.removeChild(reduxState);
  t.end();
});

tape('browser with preloadedState and a __REDUX_STATE__ element', t => {
  const Redux = GetReduxPlugin();
  const reduxState = document.createElement('script');
  reduxState.setAttribute('type', 'application/json');
  reduxState.setAttribute('id', '__REDUX_STATE__');
  reduxState.textContent = JSON.stringify({
    hello: 'unused',
    unused: 'not used',
  });
  document.body && document.body.appendChild(reduxState);
  const reducer = (state, action) => {
    return {
      ...state,
      test: action.payload || 1,
    };
  };
  const {store} = Redux.provides({
    reducer,
    preloadedState: {hello: 'world'},
  }).from();
  t.deepLooseEqual(store.getState(), {test: 1, hello: 'world'});
  store.dispatch({type: 'CHANGE', payload: 2});
  t.deepLooseEqual(store.getState(), {test: 2, hello: 'world'});
  document.body && document.body.removeChild(reduxState);
  t.end();
});

tape('browser with enhancer', t => {
  const Redux = GetReduxPlugin();
  const mockCtx = {mock: true};
  const reducer = (state, action) => {
    return {
      ...state,
      test: action.payload || 1,
    };
  };
  let enhancerCalls = 0;
  const enhancer = createStore => {
    enhancerCalls++;
    t.equal(typeof createStore, 'function');
    return (...args) => {
      t.equal(args[0], reducer);
      const store = createStore(...args);
      // $FlowFixMe
      t.equal(store.ctx, mockCtx, '[Enhancer] ctx provided by ctxEnhancer');
      return store;
    };
  };
  const {store} = Redux.provides({reducer, enhancer}).from(
    ((mockCtx: any): Context)
  );
  if (!store.ctx) {
    return;
  }
  t.equal(store.ctx, mockCtx, '[Final store] ctx provided by ctxEnhancer');
  t.deepLooseEqual(store.getState(), {test: 1});
  store.dispatch({type: 'CHANGE', payload: 2});
  t.equals(store.getState().test, 2);
  t.equal(enhancerCalls, 1);
  t.end();
});

tape('browser with devtools enhancer', t => {
  const Redux = GetReduxPlugin();
  const reducer = (state, action) => {
    return {
      ...state,
      test: action.payload || 1,
    };
  };
  let enhancerCalls = 0;
  window.__REDUX_DEVTOOLS_EXTENSION__ = () => createStore => {
    enhancerCalls++;
    t.equal(typeof createStore, 'function');
    return (...args) => {
      t.equal(args[0], reducer);
      return createStore(...args);
    };
  };
  const {store} = Redux.provides({reducer}).from();
  t.deepLooseEqual(store.getState(), {test: 1});
  store.dispatch({type: 'CHANGE', payload: 2});
  t.equals(store.getState().test, 2);
  t.equal(enhancerCalls, 1);
  delete window.__REDUX_DEVTOOLS_EXTENSION__;
  t.end();
});

tape('browser with devtools enhancer and normal enhancer', t => {
  const Redux = GetReduxPlugin();
  const reducer = (state, action) => {
    return {
      ...state,
      test: action.payload || 1,
    };
  };
  let devtoolsEnhancerCalls = 0;
  let enhancerCalls = 0;
  window.__REDUX_DEVTOOLS_EXTENSION__ = () => createStore => {
    devtoolsEnhancerCalls++;
    t.equal(typeof createStore, 'function');
    return (...args) => {
      t.equal(args[0], reducer);
      return createStore(...args);
    };
  };
  const enhancer = createStore => {
    enhancerCalls++;
    t.equal(typeof createStore, 'function');
    return (...args) => {
      t.equal(args[0], reducer);
      return createStore(...args);
    };
  };
  const {store} = Redux.provides({reducer, enhancer}).from();
  t.deepLooseEqual(store.getState(), {test: 1});
  store.dispatch({type: 'CHANGE', payload: 2});
  t.equals(store.getState().test, 2);
  t.equal(devtoolsEnhancerCalls, 1);
  t.equal(enhancerCalls, 1);
  delete window.__REDUX_DEVTOOLS_EXTENSION__;
  t.end();
});

tape('browser middleware', async t => {
  const Redux = GetReduxPlugin();
  const reducer = (state, action) => ({
    test: action.payload || 1,
  });
  function Component(props) {
    t.equal(props.test, 1);
    t.equal(typeof props.dispatch, 'function');
    return React.createElement('div');
  }
  const Connected = connect(state => state)(Component);
  const element = React.createElement(Connected);
  const ctx = {element};
  const Plugin = Redux.provides({reducer});
  try {
    await (Redux.middleware &&
      Redux.middleware(null, Plugin)((ctx: any), () => Promise.resolve()));
  } catch (e) {
    t.ifError(e);
  }
  t.notEquals(ctx.element, element, 'wraps provider');
  const rendered = mount(ctx.element);
  t.equal(rendered.find(Connected).length, 1);
  t.equal(rendered.find(Component).length, 1);
  t.equal(rendered.find(Component).props().test, 1);
  t.equal(typeof rendered.find(Component).props().dispatch, 'function');
  t.end();
});
