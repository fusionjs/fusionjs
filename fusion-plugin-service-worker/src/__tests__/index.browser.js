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

if (window.navigator && window.navigator.serviceWorker) {
  window.navigator.serviceWorker.register = function(path) {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve(path);
      }, 300);
    });
  };
}

test('/registers sw', async t => {
  mockAddEventListener();
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
  mockAddEventListener();
  let logged = '';
  const app = new App('el', el => el);
  app.register(SWRegisterToken, false);
  app.register(SWLoggerToken, {
    log(...args) {
      logged += args.join(' ');
      t.equal(logged, '*** sw unregistered');
      t.end();
    },
  });
  app.register(ServiceWorker);
  const sim = getSimulator(app);
  await sim.render('/');
  await app.cleanup();
});
