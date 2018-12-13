/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import fs from 'fs';
import util from 'util';

export const storeSync = (value: any) => {
  const file = '.fusion/fusion-stats.json';
  const string = JSON.stringify(value, null, 2);
  if (!fs.existsSync('.fusion')) fs.mkdirSync('.fusion');
  fs.writeFileSync(file, string, 'utf8');
};
export const store = async (value: any) => {
  const writeFile = util.promisify(fs.writeFile);
  const file = '.fusion/fusion-stats.json';
  const string = JSON.stringify(value, null, 2);
  return writeFile(file, string, 'utf8');
};
