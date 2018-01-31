/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */

import App from 'fusion-core';
import test from 'tape-cup';
import {getSimulator} from 'fusion-test-utils';
import ErrorHandling, {ErrorHandlingEmitterToken} from '../client';

test('Get exception stack frames', t => {
  t.plan(4);

  const app = new App('test', el => el);

  const mockError = new Error('mock');
  const mockEmit = e => {
    t.equal(e, mockError, 'emits error');
  };

  function h() {
    throw mockError;
  }

  class Foo {
    addEventListener(event, handler) {
      t.equal(event, 'some-event', 'passes event type through');
      t.notEqual(handler, h, 'wraps handler in try catch');
      handler();
    }
  }

  window.__foo__ = Foo;

  app.register(ErrorHandling);
  app.register(ErrorHandlingEmitterToken, mockEmit);

  getSimulator(app);

  try {
    window.__foo__.prototype.addEventListener('some-event', h);
  } catch (e) {
    t.equal(e, mockError, 'throws error in dev');
  }

  t.end();
});
