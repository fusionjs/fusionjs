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
    escape('<meta name="" />&'),
    '\\u003Cmeta name=\\u0022\\u0022 /\\u003E\\u0026'
  );
  t.end();
});
test('unescaping works', async t => {
  t.equals(
    unescape('\\u003Cmeta name=\\u0022\\u0022 /\\u003E\\u0026'),
    '<meta name="" />&'
  );
  t.end();
});
test('html sanitization works', async t => {
  const userData = '<malicious data="" />';
  const value = html`
    <div>${userData}</div>
    ${String(null)}
  `;
  t.equals(typeof value, 'object');
  t.equals(
    consumeSanitizedHTML(value),
    `\n    <div>\\u003Cmalicious data=\\u0022\\u0022 /\\u003E</div>\n    null\n  `
  );
  t.end();
});
test('nested sanitization works', async t => {
  const safe = html`
    hello
  `;
  const value = html`
    <div>${safe}</div>
  `;
  t.equals(typeof value, 'object');
  t.equals(consumeSanitizedHTML(value), `\n    <div>\n    hello\n  </div>\n  `);
  t.end();
});
test('dangerouslySetHTML works', async t => {
  const trusted = dangerouslySetHTML(JSON.stringify({a: 1}));
  t.equals(typeof trusted, 'object');
  t.equals(consumeSanitizedHTML(trusted), `{"a":1}`);
  t.end();
});
