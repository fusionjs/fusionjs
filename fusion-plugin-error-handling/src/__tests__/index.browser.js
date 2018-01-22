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
  t.plan(2);

  const app = new App('test', el => el);

  const mockError = new Error('mock');
  const mockEmit = e => {
    t.equal(e, mockError, 'emits error');
  };

  const mockAddEventListener = () => t.pass('called original register');
  window.__foo__ = {
    prototype: {
      addEventListener: mockAddEventListener,
    },
  };

  app.register(ErrorHandling);
  app.register(ErrorHandlingEmitterToken, mockEmit);
  getSimulator(app);

  t.notEqual(
    window.__foo__.prototype.addEventListener,
    mockAddEventListener,
    'addEventListener wrapped'
  );

  const rejectionEvent = new Event('unhandledrejection');
  rejectionEvent.reason = mockError;
  window.dispatchEvent(rejectionEvent);

  t.end();
});
