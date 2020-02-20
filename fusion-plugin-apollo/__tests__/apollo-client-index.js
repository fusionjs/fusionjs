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
import {ApolloClientToken} from '../src/tokens';
import {ApolloLink} from 'apollo-link';
import {FetchToken} from 'fusion-tokens';
import unfetch from 'unfetch';

import {ApolloClientPlugin, GetApolloClientLinksToken} from '../src/apollo-client/index.js';

test('ApolloUniveralClient', async () => {
  const app = new App('el', el => el);
  app.register(GetApolloClientLinksToken, links => [
    new ApolloLink((op, forward) => {
      return forward(op);
    }),
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
        expect(client.link).toBeTruthy();
        expect(client.cache instanceof InMemoryCache).toBeTruthy();
        // memoizes the client on ctx correctly
        expect(client).toBe(universalClient(ctx, {}));
        return next();
      };
    },
  });
  app.register(testPlugin);

  const simulator = getSimulator(app);
  await simulator.render('/');
  await simulator.render('/');
  expect(clients.length).toBe(2);
  expect(clients[0]).not.toBe(clients[1]);
  expect(clients[0].cache).not.toBe(clients[1].cache);
});
