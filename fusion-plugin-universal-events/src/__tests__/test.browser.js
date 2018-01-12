// MIT License

// Copyright (c) 2017 Uber Technologies, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import test from 'tape-cup';
import App from 'fusion-core';
import {FetchToken} from 'fusion-tokens';
import {render} from 'fusion-test-utils';
import plugin from '../browser.js';
import {UniversalEventsToken} from '../index';

function getApp(fetch) {
  const app = new App('el', el => el);
  app.register(FetchToken, () => fetch);
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

  await render(app, '/');

  await new Promise(resolve => setTimeout(resolve, 100));

  t.equals(emitted, true, 'emitted');
  t.equals(fetched, true, 'fetched');
  t.end();
});
