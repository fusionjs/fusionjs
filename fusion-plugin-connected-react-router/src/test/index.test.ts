/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */

// @ts-ignore
const {default: App} = require('fusion-react');
const {RenderToken, createPlugin} = require('fusion-core');
const React = require('react');
const {renderToString} = require('react-dom/server');
const {
  default: Router,
  RouterToken,
  // $FlowFixMe - Pinned to v5 of react router
  RouterProviderToken,
} = require('fusion-plugin-react-router');
const {
  default: ConnectedRouterEnhancer,
  ConnectedRouterEnhancerToken,
} = require('..');
const {
  default: ReduxPlugin,
  ReduxToken,
  EnhancerToken,
  ReducerToken,
} = require('fusion-plugin-react-redux');
const {ConnectedRouter, push} = require('connected-react-router');
const {getSimulator} = require('fusion-test-utils');
const {connect} = require('react-redux');

test('An app', async () => {
  expect.assertions(5);
  const Root = connect((state) => state, {push})((props) => {
    expect(props.router.location.pathname).toBe('/');
    props.push('/test');
    return React.createElement('div', null, 'Hello World');
  });
  const app = new App(React.createElement(Root));
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
  app.enhance(RouterToken, (oldRouter) => {
    return {
      from: (ctx) => {
        const {history} = oldRouter.from(ctx);
        return {
          history: {
            ...history,
            push(url) {
              expect(url).toBe('/test');
            },
          },
        };
      },
    };
  });
  app.register(
    createPlugin({
      deps: {redux: ReduxToken},
      middleware:
        ({redux}) =>
        async (ctx, next) => {
          await next();
          const store = redux.from(ctx).store;
          const state = store.getState();
          expect(typeof state.router.location.pathname).toBe('string');
          expect(typeof state.router.action).toBe('string');
          store.dispatch({
            type: 'TEST',
          });
          expect(store.getState().test).toBe(true);
        },
    })
  );

  const sim = getSimulator(app);
  await sim.render('/');
});

test('Exports a token', () => {
  expect(ConnectedRouterEnhancerToken).toBeDefined();
});
