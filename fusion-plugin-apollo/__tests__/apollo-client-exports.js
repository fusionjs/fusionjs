/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  ApolloClientPlugin,
  GetApolloClientCacheToken,
  ApolloClientCredentialsToken,
  GetApolloClientLinksToken,
  ApolloClientDefaultOptionsToken,
  ApolloClientResolversToken,
} from '../src/apollo-client/index.js';

test('exports', () => {
  expect(ApolloClientPlugin).toBeTruthy();
  expect(GetApolloClientCacheToken).toBeTruthy();
  expect(ApolloClientCredentialsToken).toBeTruthy();
  expect(GetApolloClientLinksToken).toBeTruthy();
  expect(ApolloClientDefaultOptionsToken).toBeTruthy();
  expect(ApolloClientResolversToken).toBeTruthy();
});
