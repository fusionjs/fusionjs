/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import React from 'react';
import {
  ApolloRenderEnhancer,
  GraphQLSchemaToken,
  ApolloClientToken,
  ApolloClientPlugin,
  ApolloBodyParserConfigToken,
  ApolloContextToken,
  ApolloDefaultOptionsConfigToken,
} from '../src/index';
import gql from 'graphql-tag';
import App from 'fusion-react';
import {RenderToken} from 'fusion-core';
import {ApolloClient} from 'apollo-client';
import {InMemoryCache} from 'apollo-cache-inmemory';
import {HttpLink} from 'apollo-link-http';
import getPort from 'get-port';
import http from 'http';
import fetch from 'node-fetch';
import {makeExecutableSchema} from 'graphql-tools';
import {LoggerToken} from 'fusion-tokens';

async function testApp(el, {typeDefs, resolvers}, enhanceApp) {
  const port = await getPort();
  const endpoint = `http://localhost:${port}/graphql`;
  const app = new App(el);
  const schema = makeExecutableSchema({typeDefs, resolvers});
  const client = new ApolloClient({
    cache: new InMemoryCache({
      addTypename: false,
    }).restore({}),
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
  app.register(ApolloClientToken, ApolloClientPlugin);
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
  return {app, server, client, endpoint};
}

test('Query request', async () => {
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
        expect(ctx.path).toBe('/graphql');
        return 'test';
      },
    },
  };
  const {server, client} = await testApp(el, {typeDefs, resolvers});
  const result = await client.query({query});
  expect(result).toEqual({
    data: {test: 'test'},
    loading: false,
    networkStatus: 7,
    stale: false,
  });
  server.close();
});

test('Query request with custom apollo context', async () => {
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
        expect(ctx).toBe(5);
        return 'test';
      },
    },
  };
  const {server, client} = await testApp(el, {typeDefs, resolvers}, app => {
    // $FlowFixMe
    app.register(ApolloContextToken, 5);
  });
  const result = await client.query({query});
  expect(result).toEqual({
    data: {test: 'test'},
    loading: false,
    networkStatus: 7,
    stale: false,
  });
  server.close();
});

test('Mutation request', async () => {
  const mutation = gql`
    mutation Test($arg: String) {
      testMutation(arg: $arg) {
        result
      }
    }
  `;
  const el = <div />;
  const typeDefs = gql`
    type Query {
      test: String
    }
    type Mutation {
      testMutation(arg: String): MutationResult
    }
    type MutationResult {
      result: String
    }
  `;
  const resolvers = {
    Query: {
      test(parent, args, ctx) {
        return 'test';
      },
    },
    Mutation: {
      testMutation(parent, args, ctx) {
        expect(args.arg).toBe('test');
        return {
          result: 'pass',
        };
      },
    },
  };
  const {server, client} = await testApp(el, {typeDefs, resolvers});
  const result = await client.mutate({mutation, variables: {arg: 'test'}});
  expect(result.data).toEqual({
    testMutation: {
      result: 'pass',
    },
  });
  server.close();
});

test('Mutation request with error', async done => {
  const mutation = gql`
    mutation Test($arg: String) {
      testMutation(arg: $arg) {
        result
      }
    }
  `;
  const el = <div />;
  const typeDefs = gql`
    type Query {
      test: String
    }
    type Mutation {
      testMutation(arg: String): MutationResult
    }
    type MutationResult {
      result: String
    }
  `;
  const resolvers = {
    Query: {
      test(parent, args, ctx) {
        return 'test';
      },
    },
    Mutation: {
      testMutation(parent, args, ctx) {
        expect(args.arg).toBe('test');
        throw new Error('FAIL');
      },
    },
  };
  const {server, client} = await testApp(el, {typeDefs, resolvers});
  await expect(
    client.mutate({mutation, variables: {arg: 'test'}})
  ).rejects.toThrow('GraphQL error: FAIL');
  server.close();
  done();
});

test('Query request with error', async done => {
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
        throw new Error('FAIL');
      },
    },
  };
  const {server, endpoint} = await testApp(el, {typeDefs, resolvers});
  const client = new ApolloClient({
    cache: new InMemoryCache().restore({}),
    link: new HttpLink({
      endpoint,
      fetch: async (url, options) => {
        // required since the url here is only the path
        const result = await fetch(endpoint, options);
        expect(result.ok).toBe(true);
        const json = await result.json();
        expect(json.errors[0].message).toBe('FAIL');
        expect(json.data).toEqual({test: null});
        // duplicate fetch so we can assert on json, but also return to client
        return fetch(endpoint, options);
      },
    }),
  });
  await expect(client.query({query})).rejects.toThrow('GraphQL error: FAIL');
  server.close();
  done();
});

test('/graphql endpoint with body parser config', async () => {
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
        expect(ctx.path).toBe('/graphql');
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
  expect(called).toBeTruthy();
  expect(result).toEqual({
    data: {test: 'test'},
    loading: false,
    networkStatus: 7,
    stale: false,
  });
  server.close();
});

test('Query request with custom apollo server options config', async () => {
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
  const resolvers = {};
  const mocks = {
    Query: () => ({
      test(parent, args, ctx) {
        expect(ctx.path).toBe('/graphql');
        return 'test';
      },
    }),
  };
  const {server, client} = await testApp(el, {typeDefs, resolvers}, app => {
    app.register(ApolloDefaultOptionsConfigToken, {mocks});
  });
  const result = await client.query({query});
  expect(result).toEqual({
    data: {test: 'test'},
    loading: false,
    networkStatus: 7,
    stale: false,
  });
  server.close();
});

test('Invalid query request - logs error', async done => {
  const query = gql`
    query Test {
      lmao
    }
  `;
  const el = <div />;
  const typeDefs = gql`
    type Query {
      test: String
    }
  `;
  const resolvers = {};
  let logCount = 0;
  const {server, client} = await testApp(el, {typeDefs, resolvers}, app => {
    // $FlowFixMe
    app.register(LoggerToken, {
      error: (message, error) => {
        expect(message).toBe('Cannot query field "lmao" on type "Query".');
        expect(error instanceof Error).toBe(true);
        logCount++;
      },
    });
  });

  await expect(client.query({query})).rejects.toThrow();
  expect(logCount).toBe(1);
  server.close();
  done();
});
