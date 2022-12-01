/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import {
  ApolloRenderEnhancer,
  ApolloContextToken,
  GraphQLSchemaToken,
  gql,
  GraphQLEndpointToken,
  ApolloDefaultOptionsConfigToken,
} from '../src/index.js';

test('fusion-tokens exports', () => {
  expect(ApolloContextToken).toBeTruthy();
  expect(ApolloDefaultOptionsConfigToken).toBeTruthy();
  expect(GraphQLSchemaToken).toBeTruthy();
  expect(GraphQLEndpointToken).toBeTruthy();
  expect(ApolloRenderEnhancer).toBeTruthy();
  expect(typeof gql).toBe('function');
  expect(gql).toThrow();
});
