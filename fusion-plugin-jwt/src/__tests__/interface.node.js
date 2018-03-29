/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import Plugin, {
  SessionCookieExpiresToken,
  SessionCookieNameToken,
  SessionSecretToken,
} from '../index';

test('interface', t => {
  t.ok(Plugin, 'exports a default plugin');
  t.ok(SessionCookieExpiresToken, 'exports SessionCookieExpiresToken');
  t.ok(SessionCookieNameToken, 'exports SessionCookieNameToken');
  t.ok(SessionSecretToken, 'exports SessionSecretToken');
  t.end();
});
