/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import {
  html,
  consumeSanitizedHTML,
  dangerouslySetHTML,
  escape,
  unescape,
} from '../src/sanitization';

test('escaping works', async () => {
  expect(escape('<meta name="" />&')).toBe(
    '\\u003Cmeta name=\\u0022\\u0022 /\\u003E\\u0026'
  );
});
test('unescaping works', async () => {
  expect(unescape('\\u003Cmeta name=\\u0022\\u0022 /\\u003E\\u0026')).toBe(
    '<meta name="" />&'
  );
});
test('html sanitization works', async () => {
  const userData = '<malicious data="" />';
  const value = html`
    <div>${userData}</div>
    ${String(null)}
  `;
  expect(typeof value).toBe('object');
  expect(consumeSanitizedHTML(value)).toBe(
    `\n    <div>\\u003Cmalicious data=\\u0022\\u0022 /\\u003E</div>\n    null\n  `
  );
});
test('nested sanitization works', async () => {
  const safe = html` hello `;
  const value = html` <div>${safe}</div> `;
  expect(typeof value).toBe('object');
  expect(consumeSanitizedHTML(value)).toBe(` <div> hello </div> `);
});
test('dangerouslySetHTML works', async () => {
  const trusted = dangerouslySetHTML(JSON.stringify({a: 1}));
  expect(typeof trusted).toBe('object');
  expect(consumeSanitizedHTML(trusted)).toBe(`{"a":1}`);
});
test('sanitization with empty string works', async () => {
  const obj = dangerouslySetHTML('');
  expect(escape(obj)).toBe('');
});
