/*
We never want developers to be able to write `ctx.body.body.push(`<div>${stuff}</div>`)`
because that allows XSS attacks by default (e.g. if stuff === '<script>alert(1)</script>')
Instead, they should use html`<div>{stuff}</div>` so interpolated data gets automatically escaped
We trust the markup outside of interpolation because it's code written by a developer with commit permissions,
which can be audited via code reviews
*/
let html, dangerouslySetHTML, consumeSanitizedHTML, escape, unescape;
if (__NODE__) {
  const forbiddenChars = {
    '<': '\\u003C',
    '>': '\\u003E',
    '"': '\\u0022',
    '/': '\\u002F',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029',
  };
  const replaceForbidden = c => forbiddenChars[c];
  const replaceEscaped = c => String.fromCodePoint(parseInt(c.slice(2), 16));

  const key = Symbol('sanitized html');
  html = ([head, ...rest], ...values) => {
    const obj = {};
    Object.defineProperty(obj, key, {
      enumerable: false,
      configurable: false,
      value: head + values.map((s, i) => escape(s) + rest[i]).join(''),
    });
    return obj;
  };
  dangerouslySetHTML = str => html([str]);
  escape = str => {
    if (str && str[key]) return consumeSanitizedHTML(str);
    return String(str).replace(/[<>"/\u2028\u2029]/g, replaceForbidden);
  };
  unescape = str => {
    return str.replace(
      /\\u003C|\\u003E|\\u0022|\\u002F|\\u2028|\\u2029/g,
      replaceEscaped
    );
  };
  consumeSanitizedHTML = h => {
    if (typeof h === 'string') {
      throw new Error(`Unsanitized html. Use html\`${h}\``);
    }
    return h[key];
  };
}

export {html, dangerouslySetHTML, consumeSanitizedHTML, escape, unescape};
