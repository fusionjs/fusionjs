// @flow

import test from 'tape-cup';
import React from 'react';
import App, {
  ApolloClientToken,
  ApolloContextToken,
  GraphQLSchemaToken,
  gql,
} from '../index.js';
import {getSimulator} from 'fusion-test-utils';

test('fusion-tokens exports', t => {
  t.ok(ApolloClientToken, 'exports ApolloClientToken');
  t.ok(ApolloContextToken, 'exports ApolloContextToken');
  t.ok(GraphQLSchemaToken, 'exports GraphQLSchemaToken');
  t.ok(App, 'exports App');
  t.equal(typeof gql, 'function', 'exports a gql function');
  t.throws(gql, 'gql function throws an error if executed directly');
  t.end();
});

test('App with custom render function', async t => {
  const app = new App(<div>Hello world</div>, el => {
    t.ok(el);
    return 'rendered';
  });
  app.register(ApolloClientToken, () => {
    // $FlowFixMe
    return {
      cache: {
        extract: () => {},
      },
    };
  });
  const simulator = getSimulator(app);
  const ctx = await simulator.render('/');
  t.equal(ctx.rendered, 'rendered', 'custom render function called');
  t.end();
});
