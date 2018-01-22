/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import test from 'tape-cup';
import App from 'fusion-core';
import {FetchToken} from 'fusion-tokens';
import {getSimulator} from 'fusion-test-utils';
import plugin from '../browser.js';
import {UniversalEventsToken} from '../index';

function getApp(fetch) {
  const app = new App('el', el => el);
  app.register(FetchToken, fetch);
  app.register(UniversalEventsToken, plugin);
  return app;
}

test('Browser EventEmitter', async t => {
  let fetched = false;
  let emitted = false;
  const fetch = (url, {method, headers, body}) => {
    t.equals(url, '/_events', 'url is ok');
    t.equals(method, 'POST', 'method is ok');
    t.equals(
      headers['Content-Type'],
      'application/json',
      'content-type is okay'
    );
    const jsonBody = JSON.parse(body);
    t.equals(jsonBody.items.length, 1, 'data size is ok');
    t.equals(jsonBody.items[0].payload.x, 1, 'data is ok');
    fetched = true;
    return Promise.resolve();
  };
  const app = getApp(fetch);
  app.middleware({events: UniversalEventsToken}, ({events}) => {
    return (ctx, next) => {
      const emitter = events.from(ctx);
      t.equal(emitter, events);
      emitter.on('a', ({x}) => {
        t.equals(x, 1, 'payload is correct');
        emitted = true;
      });
      emitter.emit('a', {x: 1});
      emitter.flush();
      emitter.teardown();
      return next();
    };
  });
  const simulator = getSimulator(app);
  await simulator.render('/');

  await new Promise(resolve => setTimeout(resolve, 100));

  t.equals(emitted, true, 'emitted');
  t.equals(fetched, true, 'fetched');
  t.end();
});
