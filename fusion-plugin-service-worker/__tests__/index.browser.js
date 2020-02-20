// @flow
/* global window */
import {getSimulator} from 'fusion-test-utils';
import App from 'fusion-core';

import ServiceWorker from '../src/index';
import {SWLoggerToken, SWRegisterToken} from '../src/tokens';

beforeEach(() => {
  const mockRegister = jest.fn(path => Promise.resolve(path));
  const mockGetRegistrations = jest.fn(() =>
    Promise.resolve([{unregister: () => Promise.resolve(true)}])
  );
  const mockAddEventListener = jest.fn((_, fn) => fn());
  window.navigator.serviceWorker = {
    register: mockRegister,
    getRegistrations: mockGetRegistrations,
    addEventListener: mockAddEventListener,
  };
});

afterEach(() => {
  delete window.navigator.serviceWorker;
});

test('/registers sw', async done => {
  expect.assertions(1);
  mockAddEventListener();
  let logged = '';
  const app = new App('el', el => el);
  app.register(SWLoggerToken, {
    log(...args) {
      logged += args.join(' ');
      expect(logged).toBe('*** sw registered: /sw.js');
      done();
    },
  });
  app.register(ServiceWorker);

  const sim = getSimulator(app);
  await sim.render('/');
  await app.cleanup();
});

test('/unregisters sw', async done => {
  expect.assertions(1);
  mockAddEventListener();
  let logged = '';
  const app = new App('el', el => el);
  app.register(SWRegisterToken, false);
  app.register(SWLoggerToken, {
    log(...args) {
      logged += args.join(' ');
      expect(logged).toBe('*** unregistering 1 sw');
      done();
    },
  });
  app.register(ServiceWorker);
  const sim = getSimulator(app);
  await sim.render('/');
  await app.cleanup();
});

function mockAddEventListener() {
  const addEventListener = window.addEventListener;
  window.addEventListener = function(_, fn) {
    fn();
    window.addEventListener = addEventListener;
  };
}
