/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env browser */
import HelmetPlugin, {Helmet, HelmetProvider} from '../src/index';

test('exports are', () => {
  expect(HelmetPlugin).toBeTruthy();
  expect(Helmet).toBeTruthy();
  expect(HelmetProvider).toBeTruthy();
});
