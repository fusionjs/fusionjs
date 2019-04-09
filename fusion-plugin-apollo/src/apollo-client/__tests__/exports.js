/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import {
  ApolloClientPlugin,
  GetApolloClientCacheToken,
  ApolloClientCredentialsToken,
  GetApolloClientLinksToken,
  ApolloClientDefaultOptionsToken,
  ApolloClientResolversToken,
} from '../index.js';

test('exports', t => {
  t.ok(ApolloClientPlugin, 'exports ApolloClientPlugin');
  t.ok(GetApolloClientCacheToken, 'exports GetApolloClientCacheToken');
  t.ok(ApolloClientCredentialsToken, 'exports ApolloClientCredentialsToken');
  t.ok(GetApolloClientLinksToken, 'exports ApolloClientAuthKeyToken');
  t.ok(ApolloClientDefaultOptionsToken, 'exports ApolloClientAuthKeyToken');
  t.ok(ApolloClientResolversToken, 'exports ApolloClientResolversToken');
  t.end();
});
