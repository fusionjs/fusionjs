/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */

import App from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';

import ErrorHandlingPlugin, {ErrorHandlingEmitterToken} from '../src/client';

test('Get exception stack frames', () => {
  expect.assertions(4);

  const app = new App('test', el => el);

  const mockError = new Error('mock');
  const mockEmit = e => {
    expect(e).toBe(mockError);
  };

  function h() {
    throw mockError;
  }

  class Foo {
    addEventListener(event, handler) {
      expect(event).toBe('some-event');
      expect(handler).not.toBe(h);
      handler();
    }
  }

  window.__foo__ = Foo;

  app.register(ErrorHandlingPlugin);
  app.register(ErrorHandlingEmitterToken, mockEmit);

  getSimulator(app);

  expect(() =>
    window.__foo__.prototype.addEventListener('some-event', h)
  ).toThrow(mockError);
});

test("Don't break on cross-origin exceptions", () => {
  expect.assertions(1);

  const app = new App('test', el => el);

  window.opener = new Proxy(
    {},
    {
      get: () => {
        // Simulate an Exception on all access to `window.opener`
        throw new Error('Simulated `DOMException`');
      },
    }
  );

  app.register(ErrorHandlingPlugin);

  expect(() => getSimulator(app)).not.toThrow();
});
