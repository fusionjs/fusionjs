// @flow
/* global window */
import test from 'tape-cup';
import {getSimulator} from 'fusion-test-utils';
import App from 'fusion-core';

import ServiceWorker from '../index';
import {SWLoggerToken, SWRegisterToken} from '../tokens';

function mockAddEventListener() {
  const addEventListener = window.addEventListener;
  window.addEventListener = function(_, fn) {
    fn();
    window.addEventListener = addEventListener;
  };
}

function mockRegister() {
  if (window.navigator && window.navigator.serviceWorker) {
    const realRegister = window.navigator.serviceWorker.getRegistrations;
    window.navigator.serviceWorker.register = function(path) {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          window.navigator.serviceWorker.register = realRegister;
          resolve(path);
        }, 300);
      });
    };
  }
}

function mockGetRegistrations() {
  if (window.navigator && window.navigator.serviceWorker) {
    const realGetRegistrations =
      window.navigator.serviceWorker.getRegistrations;
    window.navigator.serviceWorker.getRegistrations = function() {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          resolve([
            {
              unregister() {
                window.navigator.serviceWorker.getRegistrations = realGetRegistrations;
                return true;
              },
            },
          ]);
        }, 300);
      });
    };
  }
}

test('/registers sw', async t => {
  t.plan(1);
  mockAddEventListener();
  mockRegister();
  let logged = '';
  const app = new App('el', el => el);
  app.register(SWLoggerToken, {
    log(...args) {
      logged += args.join(' ');
      t.equal(logged, '*** sw registered: /sw.js');
      t.end();
    },
  });
  app.register(ServiceWorker);
  const sim = getSimulator(app);
  await sim.render('/');
  await app.cleanup();
});

test('/unregisters sw', async t => {
  t.plan(1);
  mockAddEventListener();
  mockGetRegistrations();
  let logged = '';
  const app = new App('el', el => el);
  app.register(SWRegisterToken, false);
  app.register(SWLoggerToken, {
    log(...args) {
      logged += args.join(' ');
      t.equal(logged, '*** unregistering 1 sw');
      t.end();
    },
  });
  app.register(ServiceWorker);
  const sim = getSimulator(app);
  await sim.render('/');
  await app.cleanup();
});
