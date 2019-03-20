/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import test from 'tape-cup';
import plugin, {
  ApolloContextToken,
  GraphQLSchemaToken,
  gql,
  GraphQLEndpointToken,
} from '../index.js';

test('fusion-tokens exports', t => {
  t.ok(ApolloContextToken, 'exports ApolloContextToken');
  t.ok(GraphQLSchemaToken, 'exports GraphQLSchemaToken');
  t.ok(GraphQLEndpointToken, 'exports GraphQLSchemaToken');
  t.ok(plugin, 'exports plugin');
  t.equal(typeof gql, 'function', 'exports a gql function');
  t.throws(gql, 'gql function throws an error if executed directly');
  t.end();
});
