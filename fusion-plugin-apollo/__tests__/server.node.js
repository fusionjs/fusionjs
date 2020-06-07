/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */

import {getSimulator} from 'fusion-test-utils';
import React from 'react';
import {
  ApolloRenderEnhancer,
  GraphQLSchemaToken,
  ApolloClientToken,
  ApolloClientPlugin,
  GraphQLEndpointToken,
  ApolloContextToken,
} from '../src/index';
import gql from 'graphql-tag';
import {makeExecutableSchema} from 'graphql-tools';
import {Query} from '@apollo/react-components';
import App from 'fusion-react';
import {RenderToken} from 'fusion-core';
import {FetchToken, type Fetch} from 'fusion-tokens';
import fetch from 'node-fetch';

function testApp(el, {typeDefs, resolvers}) {
  const app = new App(el);
  const schema = makeExecutableSchema({typeDefs, resolvers});
  app.enhance(RenderToken, ApolloRenderEnhancer);
  app.register(GraphQLSchemaToken, schema);
  app.register(ApolloClientToken, ApolloClientPlugin);
  return app;
}

test('Server renders without schema', async () => {
  const el = <div>Hello World</div>;
  const app = new App(el);
  app.enhance(RenderToken, ApolloRenderEnhancer);
  app.register(ApolloClientToken, ApolloClientPlugin);
  app.register(GraphQLEndpointToken, 'http://localhost:4000');
  app.register(FetchToken, ((fetch: any): Fetch));
  const simulator = getSimulator(app);
  const ctx = await simulator.render('/');
  expect(ctx.rendered.includes('Hello World')).toBe(true);
});

test('Server render simulate', async () => {
  const el = <div>Hello World</div>;
  const typeDefs = gql`
    type Query {
      test: String
    }
  `;
  const resolvers = {
    Query: {
      test(parent, args, ctx) {
        return 'test';
      },
    },
  };
  const app = testApp(el, {typeDefs, resolvers});
  const simulator = getSimulator(app);
  const ctx = await simulator.render('/');
  expect(ctx.rendered.includes('Hello World')).toBe(true);
});

test('SSR with <Query>', async () => {
  const query = gql`
    query Test {
      test
    }
  `;
  const el = (
    <div>
      <Query query={query}>
        {result => {
          if (result.loading) {
            return <div>Loading...</div>;
          } else if (result.data) {
            return <div>{result.data.test}</div>;
          } else {
            return <div>Failure</div>;
          }
        }}
      </Query>
    </div>
  );
  const typeDefs = gql`
    type Query {
      test: String
    }
  `;
  const resolvers = {
    Query: {
      test(parent, args, ctx) {
        expect(ctx.path).toBe('/');
        return 'test';
      },
    },
  };
  const app = testApp(el, {typeDefs, resolvers});
  const simulator = getSimulator(app);
  const ctx = await simulator.render('/');
  expect(ctx.rendered.includes('test')).toBe(true);
  expect(ctx.rendered.includes('Loading')).toBe(false);
  // $FlowFixMe
  expect(ctx.body.includes('ROOT_QUERY')).toBeTruthy();
});

test('SSR with <Query> and custom context', async () => {
  const query = gql`
    query Test {
      test
    }
  `;
  const el = (
    <div>
      <Query query={query}>
        {result => {
          if (result.loading) {
            return <div>Loading...</div>;
          } else if (result.data) {
            return <div>{result.data.test}</div>;
          } else {
            return <div>Failure</div>;
          }
        }}
      </Query>
    </div>
  );
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
  const app = testApp(el, {typeDefs, resolvers});
  // $FlowFixMe
  app.register(ApolloContextToken, 5);
  const simulator = getSimulator(app);
  const ctx = await simulator.render('/');
  expect(ctx.rendered.includes('test')).toBe(true);
  expect(ctx.rendered.includes('Loading')).toBe(false);
  // $FlowFixMe
  expect(ctx.body.includes('ROOT_QUERY')).toBeTruthy();
});

test('SSR with <Query> and errors', async () => {
  const query = gql`
    query Test {
      test
    }
  `;
  const el = (
    <div>
      <Query query={query}>
        {result => {
          if (result.loading) {
            return <div>Loading...</div>;
          } else if (result.data) {
            return <div>{result.data.test}</div>;
          } else {
            return <div>Failure</div>;
          }
        }}
      </Query>
    </div>
  );
  const typeDefs = gql`
    type Query {
      test: String
    }
  `;
  const resolvers = {
    Query: {
      test() {
        throw new Error('FAIL');
      },
    },
  };
  const app = testApp(el, {typeDefs, resolvers});
  const simulator = getSimulator(app);
  const ctx = await simulator.render('/');
  expect(ctx.rendered.includes('test')).toBe(false);
  expect(ctx.rendered.includes('Loading')).toBe(true);
});
