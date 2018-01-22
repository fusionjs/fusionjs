/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import tape from 'tape-cup';

const env = __BROWSER__ ? 'BROWSER' : 'NODE';

function testHelper(tapeFn) {
  return (name, testFn) => {
    return tapeFn(`${env} - ${name}`, testFn);
  };
}

const test = testHelper(tape);
test.only = testHelper(tape.only.bind(tape));
test.skip = testHelper(tape.skip.bind(tape));

export default test;
