/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import {inMemoryBatchStorage, localBatchStorage} from '../index.js';

const toBeTested = {
  localBatchStorage,
  inMemoryBatchStorage,
};

Object.keys(toBeTested).forEach(storageType => {
  const {add, addToStart, getAndClear} = toBeTested[storageType];

  test(storageType, t => {
    t.test('add', t => {
      const data = {type: 'nick', payload: 'test'};
      getAndClear();
      add(data);
      t.deepEqual(getAndClear(), [data], 'add should add to storage');
      t.end();
    });

    t.test('addToStart', t => {
      const data1 = {type: '1', payload: 'test'};
      const data2 = {type: '2', payload: 'test'};
      getAndClear();
      add(data1);
      addToStart(data2);

      t.deepEqual(
        getAndClear(),
        [data2, data1],
        'addToStart should add to beginning of array'
      );
      t.end();
    });

    t.test('getAndClear', t => {
      const data = {type: 'nick', payload: 'test'};
      getAndClear();
      add(data);

      t.deepEqual(
        getAndClear(),
        [data],
        'getAndClear should get current array'
      );
      t.notOk(getAndClear().length, 'and clear it');
      t.end();
    });

    t.test('getAndClear with limit', t => {
      const data = {type: 'nick', payload: 'test'};
      getAndClear();
      add(data);
      add(data);
      add(data);

      t.deepEqual(
        getAndClear(2),
        [data, data],
        'getAndClear should get current array with limit'
      );
      t.deepEqual(getAndClear(), [data], 'should clear with limit correctly');
      t.notOk(getAndClear().length, 'finally is cleared');
      t.end();
    });

    t.end();
  });
});
