/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import test from 'tape-cup';
import React from 'react';
import {
  ApolloRenderEnhancer,
  GraphQLSchemaToken,
  ApolloClientToken,
  ApolloBodyParserConfigToken,
} from '../index';
import gql from 'graphql-tag';
import App from 'fusion-react/dist';
import {RenderToken} from 'fusion-core';
import {ApolloClient} from 'apollo-client';
import {InMemoryCache} from 'apollo-cache-inmemory';
import {HttpLink} from 'apollo-link-http';
import getPort from 'get-port';
import http from 'http';
import fetch from 'node-fetch';
import {makeExecutableSchema} from 'graphql-tools';

async function testApp(el, {typeDefs, resolvers}, enhanceApp) {
  const port = await getPort();
  const endpoint = `http://localhost:${port}/graphql`;
  const app = new App(el);
  const schema = makeExecutableSchema({typeDefs, resolvers});
  const client = new ApolloClient({
    ssrMode: true,
    cache: new InMemoryCache().restore({}),
    link: new HttpLink({
      endpoint,
      fetch: async (url, options) => {
        // required since the url here is only the path
        const result = await fetch(endpoint, options);
        return result;
      },
    }),
  });
  app.enhance(RenderToken, ApolloRenderEnhancer);
  app.register(GraphQLSchemaToken, schema);
  app.register(ApolloClientToken, ctx => {
    // $FlowFixMe
    return {}; // should hit server
  });
  if (enhanceApp) {
    enhanceApp(app);
  }
  // $FlowFixMe
  const server = http.createServer(app.callback());
  await new Promise((resolve, reject) =>
    server.listen(port, err => {
      if (err) return reject(err);
      return resolve();
    })
  );
  return {app, server, client};
}
test('SSR with <Query>', async t => {
  const query = gql`
    query Test {
      test
    }
  `;
  const el = <div />;
  const typeDefs = gql`
    type Query {
      test: String
    }
  `;
  const resolvers = {
    Query: {
      test(parent, args, ctx) {
        t.equal(ctx.path, '/graphql', 'context defaults correctly');
        return 'test';
      },
    },
  };
  const {server, client} = await testApp(el, {typeDefs, resolvers});
  const result = await client.query({query});
  t.deepEqual(result, {
    data: {test: 'test'},
    loading: false,
    networkStatus: 7,
    stale: false,
  });
  server.close();
  t.end();
});

test('/graphql endpoint with body parser config', async t => {
  const query = gql`
    query Test {
      test
    }
  `;
  const el = <div />;
  const typeDefs = gql`
    type Query {
      test: String
    }
  `;
  const resolvers = {
    Query: {
      test(parent, args, ctx) {
        t.equal(ctx.path, '/graphql', 'context defaults correctly');
        return 'test';
      },
    },
  };
  let called = false;
  const {server, client} = await testApp(el, {typeDefs, resolvers}, app => {
    app.register(ApolloBodyParserConfigToken, {
      detectJSON: ctx => {
        called = true;
        return true;
      },
    });
  });
  const result = await client.query({query});
  t.ok(called, 'calls detectJSON function');
  t.deepEqual(result, {
    data: {test: 'test'},
    loading: false,
    networkStatus: 7,
    stale: false,
  });
  server.close();
  t.end();
});
