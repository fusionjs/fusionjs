/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import tape from 'tape-cup';
import App from 'fusion-core';
import {SessionToken} from 'fusion-tokens';
import JWTServer from '../index';

tape('registers against session token', t => {
  const app = new App('fake-element', el => el);
  app.register(SessionToken, JWTServer);
  t.end();
});
