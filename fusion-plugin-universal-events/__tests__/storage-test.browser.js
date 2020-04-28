/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {inMemoryBatchStorage, localBatchStorage} from '../src/storage/index.js';

const toBeTested = {
  localBatchStorage,
  inMemoryBatchStorage,
};

Object.keys(toBeTested).forEach(storageType => {
  const {add, addToStart, getAndClear} = toBeTested[storageType];

  // eslint-disable-next-line jest/valid-describe
  describe(storageType, () => {
    test('add', () => {
      const data1 = {type: 'nick', payload: 'test'};
      const data2 = {type: '2', payload: 'test'};
      getAndClear();
      add(data1);
      add(data2);

      expect(getAndClear()).toEqual([data1, data2]);
    });

    test('addToStart', () => {
      const data1 = {type: '1', payload: 'test'};
      const data2 = {type: '2', payload: 'test'};
      getAndClear();
      add(data1);
      addToStart(data2);

      expect(getAndClear()).toEqual([data2, data1]);
    });

    test('getAndClear', () => {
      const data = {type: 'nick', payload: 'test'};
      getAndClear();
      add(data);

      expect(getAndClear()).toEqual([data]);
      expect(getAndClear().length).toBeFalsy();
    });

    test('getAndClear with limit', () => {
      const data = {type: 'nick', payload: 'test'};
      getAndClear();
      add(data);
      add(data);
      add(data);

      expect(getAndClear(2)).toEqual([data, data]);
      expect(getAndClear()).toEqual([data]);
      expect(getAndClear().length).toBeFalsy();
    });
  });
});
