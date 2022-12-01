/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { mockFunction, test } from "../index";

test("function mocks", (assert) => {
  const myMock = mockFunction();
  assert.equal(myMock.mock.calls.length, 0);
  myMock();
  assert.equal(myMock.mock.calls.length, 1);
});

test("function mocks with an argument", (assert) => {
  const myMock = mockFunction(() => null);
  assert.equal(myMock.mock.calls.length, 0);
  myMock();
  assert.equal(myMock.mock.calls.length, 1);
});

test("matchSnapshot", (assert) => {
  const myObj = { foo: "bar" };
  assert.matchSnapshot(myObj);
});

test("matchSnapshot with name", (assert) => {
  const myObj = { foo: "bar" };
  assert.matchSnapshot(myObj, "my snapshot name");
});
