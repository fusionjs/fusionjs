/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {ApolloClientToken, GraphQLSchemaToken} from '../src/tokens';
import App, {createPlugin} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';
import {FetchToken} from 'fusion-tokens';
import {buildSchema} from 'graphql';
import gql from 'graphql-tag';
import unfetch from 'unfetch';

import {
  ApolloClientResolversToken,
  ApolloClientPlugin,
  ApolloClientLocalSchemaToken,
} from '../src/apollo-client/index.js';

test('local state management', async () => {
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

  app.register(
    ApolloClientLocalSchemaToken,
    gql`
      extend type Query {
        queryClient: String
      }
    `
  );
  app.register(FetchToken, unfetch);

  let mutationCalled = false;
  app.register(ApolloClientResolversToken, {
    Query: {
      query: () => 'foo',
      queryClient: () => 'client',
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
              queryClient @client
            }
          `,
        });
        expect(data.query).toBe('foo');
        expect(data.queryClient).toBe('client');

        expect(mutationCalled).toBe(false);
        await client.mutate({
          mutation: gql`
            mutation {
              mutate @client
            }
          `,
        });
        expect(mutationCalled).toBe(true);

        return next();
      };
    },
  });
  app.register(testPlugin);

  const simulator = getSimulator(app);
  await simulator.render('/');
});
