/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env browser */
import test from 'tape-cup';
import App from 'fusion-core';
import plugin from '../browser.js';

test('browser plugin', async t => {
  const app = new App(' ', v => v);
  const qs = document.querySelector;
  const xhr = window.XMLHttpRequest;
  try {
    const timeline = [];
    // $FlowFixMe
    document.querySelector = (...args) => {
      timeline.push(['querySelector', ...args]);
      return document.createElement('meta');
    };
    window.XMLHttpRequest = class {
      open(...args) {
        timeline.push(['open', ...args]);
      }
      setRequestHeader(...args) {
        timeline.push(['setRequestHeader', ...args]);
      }
      send(...args) {
        timeline.push(['send', ...args]);
      }
    };

    plugin(app);

    t.deepEqual(
      timeline[0],
      ['querySelector', 'meta[name=diagnostics]'],
      'checks for metadata'
    );
    t.deepEqual(
      timeline[1],
      ['open', 'POST', '/_diagnostics'],
      'posts to correct url'
    );
    t.deepEqual(
      timeline[2],
      ['setRequestHeader', 'Content-Type', 'application/json;charset=UTF-8'],
      'uses correct content-type'
    );
    t.equal(timeline[3][0], 'send', 'sends data');
    t.equal(
      JSON.parse(timeline[3][1]).timestamp.constructor,
      Number,
      'data is correct'
    );
  } finally {
    // $FlowFixMe
    document.querySelector = qs;
    window.XMLHttpRequest = xhr;
  }
  t.end();
});
