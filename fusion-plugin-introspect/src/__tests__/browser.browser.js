/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env browser */
import App from 'fusion-core';
import plugin from '../browser.js';

test('browser plugin', async () => {
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

    expect(timeline[0]).toEqual(['querySelector', 'meta[name=diagnostics]']);
    expect(timeline[1]).toEqual(['open', 'POST', '/_diagnostics']);
    expect(timeline[2]).toEqual([
      'setRequestHeader',
      'Content-Type',
      'application/json;charset=UTF-8',
    ]);
    expect(timeline[3][0]).toEqual('send');
    expect(JSON.parse(timeline[3][1]).timestamp.constructor).toEqual(Number);
  } finally {
    // $FlowFixMe
    document.querySelector = qs;
    window.XMLHttpRequest = xhr;
  }
});
