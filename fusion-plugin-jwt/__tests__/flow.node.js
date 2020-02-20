/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import App from 'fusion-core';
import {SessionToken} from 'fusion-tokens';
import JWTServer from '../src/index';

test('registers against session token', () => {
  const app = new App('fake-element', el => el);
  app.register(SessionToken, JWTServer);
});
