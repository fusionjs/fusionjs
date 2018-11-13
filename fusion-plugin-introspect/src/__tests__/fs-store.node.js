/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import proc from 'child_process';
import fs from 'fs';
import {storeSync, store} from '../fs-store.js';

test('fs.storeSync', () => {
  try {
    proc.execSync('mkdir -p .fusion');
    storeSync({a: 1});
    const data = JSON.parse(
      fs.readFileSync('.fusion/fusion-stats.json', 'utf8')
    );

    expect(data).toEqual({a: 1});
  } finally {
    proc.execSync('rm -rf .fusion');
  }
});
test('fs.store', async () => {
  try {
    proc.execSync('mkdir -p .fusion');
    await store({a: 1});
    const data = JSON.parse(
      fs.readFileSync('.fusion/fusion-stats.json', 'utf8')
    );

    expect(data).toEqual({a: 1});
  } finally {
    proc.execSync('rm -rf .fusion');
  }
});
