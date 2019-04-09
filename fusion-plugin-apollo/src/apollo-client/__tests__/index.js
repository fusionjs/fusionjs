/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {InMemoryCache} from 'apollo-cache-inmemory';
import App, {createPlugin} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';
import {ApolloClientToken} from '../../tokens';
import {ApolloLink} from 'apollo-link';
import {FetchToken} from 'fusion-tokens';
import unfetch from 'unfetch';
import test from 'tape-cup';

import {ApolloClientPlugin, GetApolloClientLinksToken} from '../index.js';

test('ApolloUniveralClient', async t => {
  const app = new App('el', el => el);
  app.register(GetApolloClientLinksToken, links => [
    new ApolloLink(),
    ...links,
  ]);
  app.register(ApolloClientToken, ApolloClientPlugin);
  app.register(FetchToken, unfetch);

  const clients = [];
  const testPlugin = createPlugin({
    deps: {
      universalClient: ApolloClientToken,
    },
    middleware({universalClient}) {
      return async (ctx, next) => {
        const client = universalClient(ctx, {});
        clients.push(client);
        t.ok(client.link);
        t.ok(client.cache instanceof InMemoryCache);
        // memoizes the client on ctx correctly
        t.equal(client, universalClient(ctx, {}));
        return next();
      };
    },
  });
  app.register(testPlugin);

  const simulator = getSimulator(app);
  await simulator.render('/');
  await simulator.render('/');
  t.equal(clients.length, 2);
  t.notEqual(clients[0], clients[1]);
  t.notEqual(clients[0].cache, clients[1].cache);
  t.end();
});
