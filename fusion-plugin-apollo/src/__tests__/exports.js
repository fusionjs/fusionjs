// @flow

import test from 'tape-cup';
import App, {
  ApolloClientToken,
  ApolloContextToken,
  GraphQLSchemaToken,
} from '../index.js';

test('fusion-tokens exports', t => {
  t.ok(ApolloClientToken, 'exports ApolloClientToken');
  t.ok(ApolloContextToken, 'exports ApolloContextToken');
  t.ok(GraphQLSchemaToken, 'exports GraphQLSchemaToken');
  t.ok(App, 'exports App');
  t.end();
});
