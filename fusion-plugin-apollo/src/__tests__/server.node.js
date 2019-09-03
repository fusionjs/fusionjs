/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */

import test from 'tape-cup';
import {getSimulator} from 'fusion-test-utils';
import React from 'react';
import {
  ApolloRenderEnhancer,
  GraphQLSchemaToken,
  ApolloClientToken,
  ApolloClientPlugin,
  GraphQLEndpointToken,
  ApolloContextToken,
} from '../index';
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

test('Server renders without schema', async t => {
  const el = <div>Hello World</div>;
  const app = new App(el);
  app.enhance(RenderToken, ApolloRenderEnhancer);
  app.register(ApolloClientToken, ApolloClientPlugin);
  app.register(GraphQLEndpointToken, 'http://localhost:4000');
  app.register(FetchToken, ((fetch: any): Fetch));
  const simulator = getSimulator(app);
  const ctx = await simulator.render('/');
  t.equal(ctx.rendered.includes('Hello World'), true, 'renders correctly');
  t.end();
});

test('Server render simulate', async t => {
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
  t.equal(ctx.rendered.includes('Hello World'), true, 'renders correctly');
  t.end();
});

test('SSR with <Query>', async t => {
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
        t.equal(ctx.path, '/', 'context defaults correctly');
        return 'test';
      },
    },
  };
  const app = testApp(el, {typeDefs, resolvers});
  const simulator = getSimulator(app);
  const ctx = await simulator.render('/');
  t.equal(ctx.rendered.includes('test'), true, 'renders correctly');
  t.equal(ctx.rendered.includes('Loading'), false, 'does not render loading');
  // $FlowFixMe
  t.ok(ctx.body.includes('ROOT_QUERY'), 'includes serialized data');
  t.end();
});

test('SSR with <Query> and custom context', async t => {
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
        t.equal(ctx, 5, 'sets custom context correctly');
        return 'test';
      },
    },
  };
  const app = testApp(el, {typeDefs, resolvers});
  // $FlowFixMe
  app.register(ApolloContextToken, 5);
  const simulator = getSimulator(app);
  const ctx = await simulator.render('/');
  t.equal(ctx.rendered.includes('test'), true, 'renders correctly');
  t.equal(ctx.rendered.includes('Loading'), false, 'does not render loading');
  // $FlowFixMe
  t.ok(ctx.body.includes('ROOT_QUERY'), 'includes serialized data');
  t.end();
});

test('SSR with <Query> and errors', async t => {
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
  t.equal(ctx.rendered.includes('test'), false, 'does not fetch data');
  t.equal(ctx.rendered.includes('Loading'), true, 'Renders the loading');
  t.end();
});
