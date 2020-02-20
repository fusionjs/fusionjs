/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import Plugin, {
  SessionCookieExpiresToken,
  SessionCookieNameToken,
  SessionSecretToken,
} from '../src/index';

test('interface', () => {
  expect(Plugin).toBeTruthy();
  expect(SessionCookieExpiresToken).toBeTruthy();
  expect(SessionCookieNameToken).toBeTruthy();
  expect(SessionSecretToken).toBeTruthy();
});
