// @flow

import test from 'tape-cup';
import App, {
  ApolloClientToken,
  ApolloContextToken,
  GraphQLSchemaToken,
  gql,
} from '../index.js';

test('fusion-tokens exports', t => {
  t.ok(ApolloClientToken, 'exports ApolloClientToken');
  t.ok(ApolloContextToken, 'exports ApolloContextToken');
  t.ok(GraphQLSchemaToken, 'exports GraphQLSchemaToken');
  t.ok(App, 'exports App');
  t.equal(typeof gql, 'function', 'exports a gql function');
  t.throws(gql, 'gql function throws an error if executed directly');
  t.end();
});
