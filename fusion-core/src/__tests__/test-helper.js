/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import tape from 'tape-cup';
import type {tape$TestCb} from 'tape-cup';
import {compose} from '../compose';

import type {Context} from '../types.js';

const env = __BROWSER__ ? 'BROWSER' : 'NODE';

function testHelper(tapeFn) {
  return (name: string, testFn: tape$TestCb) => {
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
export async function run(app: any, ctx: Context = {}) {
  // $FlowFixMe
  ctx = Object.assign(getContext(), ctx);
  await app.resolve();
  return await compose(app.plugins)(ctx, () => Promise.resolve()).then(
    () => ctx
  );
}

type FuncType = (...args: Array<any>) => any;
/**
 * Acts similar to t.throws(...) but allows for Promises to be supplied as the
 * test function.
 */
export async function throwsAsync(
  t: tape$Context,
  func: FuncType,
  messageOrExpected?: string | RegExp | FuncType
): Promise<void> {
  const message: ?string =
    typeof messageOrExpected === 'string' ? messageOrExpected : null;
  const expected: ?(RegExp | FuncType) =
    typeof messageOrExpected !== 'string' ? messageOrExpected : null;

  try {
    await func();
    t.notok(message ? `Did not throw: ${message}` : 'Does not throw');
  } catch (e) {
    if (expected) {
      t.throws(() => {
        throw e;
      }, expected);
    }
  }
}

/**
 * Acts similar to t.doesNotThrow(...) but allows for Promises to be supplied as the
 * test function.
 */
export async function doesNotThrowAsync(
  t: tape$Context,
  func: FuncType,
  message?: string
): Promise<void> {
  try {
    await func();
  } catch (e) {
    t.notok(message ? `Throws: ${message}` : 'Throws');
  }
}
