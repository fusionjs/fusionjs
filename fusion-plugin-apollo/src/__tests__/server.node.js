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
import render from '../server';
import plugin, {GraphQLSchemaToken, ApolloClientToken} from '../index';
import gql from 'graphql-tag';
import {makeExecutableSchema} from 'graphql-tools';
import {Query} from 'react-apollo';
import App from 'fusion-react/dist';
import {RenderToken} from 'fusion-core';
import {ApolloClient} from 'apollo-client';
import {InMemoryCache} from 'apollo-cache-inmemory';
import {SchemaLink} from 'apollo-link-schema';

function testApp(el, {typeDefs, resolvers}) {
  const app = new App(el);
  const schema = makeExecutableSchema({typeDefs, resolvers});
  app.register(RenderToken, plugin);
  app.register(GraphQLSchemaToken, schema);
  app.register(ApolloClientToken, ctx => {
    return new ApolloClient({
      ssrMode: true,
      cache: new InMemoryCache().restore({}),
      link: new SchemaLink({
        schema,
        context: ctx,
      }),
    });
  });
  return app;
}

test('renders', async t => {
  const rendered = await render(
    React.createElement('span', null, 'hello'),
    // $FlowFixMe
    console
  );
  t.ok(/<span/.test(rendered), 'has right tag');
  t.ok(/hello/.test(rendered), 'has right text');
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
