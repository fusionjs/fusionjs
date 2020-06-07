/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {memoize} from '../src/memoize';

import type {Context} from '../src/types.js';

test('memoize', () => {
  // $FlowFixMe
  const mockCtx: Context = {
    memoized: new Map(),
  };

  let counter = 0;
  const memoized = memoize(() => {
    return ++counter;
  });

  let counterB = 0;
  const memoizedB = memoize(() => {
    return ++counterB;
  });

  expect(memoized(mockCtx)).toBe(1);
  expect(memoized(mockCtx)).toBe(1);
  expect(memoizedB(mockCtx)).toBe(1);
  expect(memoizedB(mockCtx)).toBe(1);
  expect(memoized(mockCtx)).toBe(1);
  expect(memoized(mockCtx)).toBe(1);
});
