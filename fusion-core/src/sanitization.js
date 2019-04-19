/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*
We never want developers to be able to write `ctx.template.body.push(`<div>${stuff}</div>`)`
because that allows XSS attacks by default (e.g. if stuff === '<script>alert(1)</script>')
Instead, they should use html`<div>{stuff}</div>` so interpolated data gets automatically escaped
We trust the markup outside of interpolation because it's code written by a developer with commit permissions,
which can be audited via code reviews
*/

import type {SanitizedHTMLWrapper} from './types.js';

// eslint-disable-next-line import/no-mutable-exports
let html, dangerouslySetHTML, consumeSanitizedHTML, escape;
if (__NODE__) {
  const forbiddenChars = {
    '<': '\\u003C',
    '>': '\\u003E',
    '"': '\\u0022',
    '&': '\\u0026',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029',
  };
  const replaceForbidden = c => forbiddenChars[c];

  const key = Symbol('sanitized html');
  html = (
    [head, ...rest]: Array<string>,
    ...values: Array<string>
  ): SanitizedHTMLWrapper => {
    const obj = {};
    Object.defineProperty(obj, key, {
      enumerable: false,
      configurable: false,
      value: head + values.map((s, i) => escape(s) + rest[i]).join(''),
    });
    return obj;
  };
  dangerouslySetHTML = (str: string): Object => html([str]);
  escape = (str: any): string => {
    if (str && str[key]) return consumeSanitizedHTML(str);
    return String(str).replace(/[<>&"\u2028\u2029]/g, replaceForbidden);
  };
  consumeSanitizedHTML = (h: SanitizedHTMLWrapper): string => {
    if (typeof h === 'string') {
      throw new Error(`Unsanitized html. Use html\`${h}\``);
    }
    return h[key];
  };
}
const replaceEscaped = c => String.fromCodePoint(parseInt(c.slice(2), 16));
const unescape = (str: string): string => {
  return str.replace(
    /\\u003C|\\u003E|\\u0022|\\u002F|\\u2028|\\u2029|\\u0026/g,
    replaceEscaped
  );
};

// These types are necessary due to not having an assignment in the __BROWSER__ environment
const flowHtml = ((html: any): (
  strings: Array<string>,
  ...expressions: Array<string>
) => SanitizedHTMLWrapper);

const flowDangerouslySetHTML = ((dangerouslySetHTML: any): (
  html: string
) => Object);

const flowConsumeSanitizedHTML = ((consumeSanitizedHTML: any): (
  str: SanitizedHTMLWrapper
) => string);

const flowEscape = ((escape: any): (str: string) => string);

export {
  flowHtml as html,
  flowDangerouslySetHTML as dangerouslySetHTML,
  flowConsumeSanitizedHTML as consumeSanitizedHTML,
  flowEscape as escape,
  unescape,
};
