/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import tape from 'tape-cup';
import type {TestCb} from 'tape-cup';
import {compose} from '../compose';

import type {Context} from '../types.js';

const env = __BROWSER__ ? 'BROWSER' : 'NODE';

function testHelper(tapeFn) {
  return (name: string, testFn: TestCb) => {
    return tapeFn(`${env} - ${name}`, testFn);
  };
}

const test = testHelper(tape);
test.only = testHelper(tape.only.bind(tape));
test.skip = testHelper(tape.skip.bind(tape));

export default test;

function getContext() {
  return __BROWSER__
    ? {}
    : {
        method: 'GET',
        path: '/',
        headers: {
          accept: 'text/html',
        },
      };
}

// $FlowFixMe
export function run(app: any, ctx: Context = {}) {
  // $FlowFixMe
  ctx = Object.assign(getContext(), ctx);
  app.resolve();
  return compose(app.plugins)(ctx, () => Promise.resolve()).then(() => ctx);
}
