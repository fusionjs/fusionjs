// @flow
/* global window */
import test from 'tape-cup';
import {getSimulator} from 'fusion-test-utils';
import App from 'fusion-core';
import ServiceWorker from '../index';
import {SWLoggerToken} from '../tokens';

const addEventListener = window.addEventListener;
window.addEventListener = function(_, fn) {
  fn();
  window.addEventListener = addEventListener;
};

if (window.navigator && window.navigator.serviceWorker) {
  window.navigator.serviceWorker.register = function(path) {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve(path);
      }, 300);
    });
  };
}

let logged = '';

test('/registers sw', async t => {
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
