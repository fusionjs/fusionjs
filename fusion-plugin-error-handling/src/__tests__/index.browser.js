/* eslint-env browser */

import test from 'tape-cup';
import ErrorHandling from '../client';

test('Get exception stack frames', t => {
  t.plan(2);

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

  ErrorHandling({emit: mockEmit});

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
