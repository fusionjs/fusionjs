/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const cp = require('child_process');

module.exports = function spawn(
  commandString /*: string */
) /*: Promise<void> */ {
  const [command, ...args] = commandString.split(' ');
  const child = cp.spawn(command, args, {stdio: 'inherit'});
  return new Promise((resolve, reject) => {
    child.on('exit', code => {
      if (code === 0) {
        return resolve();
      }
      return reject(
        new Error(`Command: '${commandString}' exited with code: ${code}`)
      );
    });
    child.on('error', err => {
      return reject(err);
    });
  });
};
