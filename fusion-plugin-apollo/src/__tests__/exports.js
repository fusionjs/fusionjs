// @flow

import test from 'tape-cup';
import App, {ApolloClientToken, GraphQLSchemaToken} from '../index.js';

test('fusion-tokens exports', t => {
  t.ok(ApolloClientToken, 'exports ApolloClientToken');
  t.ok(GraphQLSchemaToken, 'exports GraphQLSchemaToken');
  t.ok(App, 'exports App');
  t.end();
});
