// @flow
import App from 'fusion-react';
import {RenderToken, createPlugin} from 'fusion-core';
import test from 'tape-cup';
import React from 'react';
import {renderToString} from 'react-dom/server';
import Router, {
  RouterToken,
  RouterProviderToken,
} from 'fusion-plugin-react-router';
import ConnectedRouterEnhancer, {
  ConnectedRouterEnhancerToken,
} from '../index.js';
import ReduxPlugin, {
  ReduxToken,
  EnhancerToken,
  ReducerToken,
} from 'fusion-plugin-react-redux';
import {ConnectedRouter, push} from 'connected-react-router';
import {getSimulator} from 'fusion-test-utils';
import {connect} from 'react-redux';

test('An app', async t => {
  t.plan(5);
  const Root = connect(
    state => state,
    {push}
  )(props => {
    t.equal(props.router.location.pathname, '/', 'connects to store correctly');
    props.push('/test');
    return <div>Hello World</div>;
  });
  const app = new App(<Root />);
  app.register(RenderToken, renderToString);
  app.register(RouterToken, Router);
  app.register(RouterProviderToken, ConnectedRouter);
  app.register(ReduxToken, ReduxPlugin);
  app.register(ReducerToken, (state = {}, action) => {
    if (action.type === 'TEST') {
      return {
        ...state,
        test: true,
      };
    }
    return state;
  });
  app.register(EnhancerToken, ConnectedRouterEnhancer);
  app.enhance(RouterToken, oldRouter => {
    return {
      from: ctx => {
        const {history} = oldRouter.from(ctx);
        return {
          history: {
            ...history,
            push(url) {
              t.equal(
                url,
                '/test',
                'dispatching actions should reach history api'
              );
            },
          },
        };
      },
    };
  });
  app.register(
    createPlugin({
      deps: {redux: ReduxToken},
      middleware: ({redux}) => async (ctx, next) => {
        await next();
        const store = redux.from(ctx).store;
        const state = store.getState();
        t.equal(
          typeof state.router.location.pathname,
          'string',
          'reducer is correct'
        );
        t.equal(typeof state.router.action, 'string', 'reducer is correct');
        store.dispatch({
          type: 'TEST',
        });
        t.equal(store.getState().test, true, 'middleware is correct');
      },
    })
  );
  const sim = getSimulator(app);
  await sim.render('/');
  t.end();
});

test('Exports a token', t => {
  t.ok(ConnectedRouterEnhancerToken, 'exports a token');
  t.end();
});
