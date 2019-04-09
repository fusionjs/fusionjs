/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {ApolloClientToken, GraphQLSchemaToken} from '../../tokens';
import App, {createPlugin} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';
import {FetchToken} from 'fusion-tokens';
import {buildSchema} from 'graphql';
import gql from 'graphql-tag';
import unfetch from 'unfetch';
import test from 'tape-cup';

import {ApolloClientResolversToken, ApolloClientPlugin} from '../index.js';

test('local state management', async t => {
  const app = new App('el', el => el);
  app.register(ApolloClientToken, ApolloClientPlugin);
  app.register(
    GraphQLSchemaToken,
    (buildSchema(`
      type Query {
        query: String!
      }

      type Mutation {
        mutate: String # returns nothing
      }
    `): any)
  );
  app.register(FetchToken, unfetch);

  let mutationCalled = false;
  app.register(ApolloClientResolversToken, {
    Query: {
      query: () => 'foo',
    },
    Mutation: {
      mutate: async () => {
        mutationCalled = true;
      },
    },
  });

  const testPlugin = createPlugin({
    deps: {
      universalClient: ApolloClientToken,
    },
    middleware({universalClient}) {
      return async (ctx, next) => {
        const client = universalClient(ctx, {});

        const {data} = await client.query({
          query: gql`
            query {
              query @client
            }
          `,
        });
        t.equal(data.query, 'foo');

        t.equal(mutationCalled, false);
        await client.mutate({
          mutation: gql`
            mutation {
              mutate @client
            }
          `,
        });
        t.equal(mutationCalled, true);

        return next();
      };
    },
  });
  app.register(testPlugin);

  const simulator = getSimulator(app);
  await simulator.render('/');
  t.end();
});
