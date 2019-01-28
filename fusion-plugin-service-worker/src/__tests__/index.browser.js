// @flow
/* global window */
import test from 'tape-cup';
import type {Context} from 'fusion-core';
import plugin from '../browser.js';

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

const mockContext: Context = ({}: any);
let logged = '';

test('registers sw', t => {
  const next = () => {
    return t.pass('Called next()');
  };
  if (plugin.middleware) {
    plugin.middleware({
      log(...args) {
        logged += args.join(' ');
        t.equal(logged, '*** sw registered: /sw.js');
        t.end();
      },
    })(mockContext, next);
  }
});
