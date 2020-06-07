/** Copyright (c) 2019 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import browserPlugin from '../src/browser.js';

test('browser exports null', () => {
  expect(browserPlugin).toEqual(null);
});
