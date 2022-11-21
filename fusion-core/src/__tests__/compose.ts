/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {compose} from '../compose';

test('composed middleware are executed correctly', () => {
  function A(ctx, next) {
    return next();
  }
  const middleware = compose([A]);
  const next = () => Promise.resolve();
  // @ts-expect-error
  expect(() => middleware({}, next)).not.toThrow();
  expect(() => middleware(void 0, next)).not.toThrow();
  // @ts-expect-error
  expect(() => middleware()).not.toThrow();
});

test('downstream and upstream run in same order as koa', (done) => {
  expect.assertions(6);
  function a(ctx, next) {
    expect(++ctx.number).toBe(1);
    return next().then(() => {
      expect(++ctx.number).toBe(6);
    });
  }
  function b(ctx, next) {
    expect(++ctx.number).toBe(2);
    return next().then(() => {
      expect(++ctx.number).toBe(5);
    });
  }
  function c(ctx, next) {
    expect(++ctx.number).toBe(3);
    return next().then(() => {
      expect(++ctx.number).toBe(4);
    });
  }
  const middleware = compose([a, b, c]);
  const ctx = {number: 0};
  const next = () => Promise.resolve();
  // @ts-expect-error
  middleware(ctx, next).then(done);
});
