/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import Plugin, {CsrfIgnoreRoutesToken} from '../src/index';

test('plugin api', () => {
  expect(Plugin).toBeTruthy();
  expect(CsrfIgnoreRoutesToken).toBeTruthy();
});
