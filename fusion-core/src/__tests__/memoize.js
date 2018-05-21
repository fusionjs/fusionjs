/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from './test-helper';
import {memoize} from '../memoize';

import type {Context} from '../types.js';

test('memoize', t => {
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

  t.equal(memoized(mockCtx), 1, 'calls function when it has no value');
  t.equal(memoized(mockCtx), 1, 'memoizes correctly');
  t.equal(memoizedB(mockCtx), 1, 'calls function when it has no value');
  t.equal(memoizedB(mockCtx), 1, 'memoizes correctly');
  t.equal(memoized(mockCtx), 1, 'calls function when it has no value');
  t.equal(memoized(mockCtx), 1, 'memoizes correctly');
  t.end();
});
