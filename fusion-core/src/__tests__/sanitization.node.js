/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import test from 'tape-cup';
import {
  html,
  consumeSanitizedHTML,
  dangerouslySetHTML,
  escape,
  unescape,
} from '../sanitization';

test('escaping works', async t => {
  t.equals(
    escape('<meta name="" />'),
    '\\u003Cmeta name=\\u0022\\u0022 \\u002F\\u003E'
  );
  t.end();
});
test('unescaping works', async t => {
  t.equals(
    unescape('\\u003Cmeta name=\\u0022\\u0022 \\u002F\\u003E'),
    '<meta name="" />'
  );
  t.end();
});
test('html sanitization works', async t => {
  const userData = '<malicious data="" />';
  const value = html`<div>${userData}</div>${null}`;
  t.equals(typeof value, 'object');
  t.equals(
    // $FlowFixMe
    consumeSanitizedHTML(value),
    `<div>\\u003Cmalicious data=\\u0022\\u0022 \\u002F\\u003E</div>null`
  );
  t.end();
});
test('nested sanitization works', async t => {
  const safe = html`hello`;
  const value = html`<div>${safe}</div>`;
  t.equals(typeof value, 'object');
  // $FlowFixMe
  t.equals(consumeSanitizedHTML(value), `<div>hello</div>`);
  t.end();
});
test('dangerouslySetHTML works', async t => {
  const trusted = dangerouslySetHTML(JSON.stringify({a: 1}));
  t.equals(typeof trusted, 'object');
  // $FlowFixMe
  t.equals(consumeSanitizedHTML(trusted), `{"a":1}`);
  t.end();
});
