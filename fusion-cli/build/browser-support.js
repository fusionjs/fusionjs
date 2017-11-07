/* eslint-env node */
const evergreen = [
  // These are the minimum browser versions that include full support for
  // ES6 syntax, bindings and functions sections
  // https://kangax.github.io/compat-table/es6/
  // https://github.com/ai/browserslist
  'Chrome >= 51',
  'Firefox >= 53',
  'Safari >= 10',
  'Edge >= 15',
  'iOS >= 10',
];

const conservative = [
  '>1%',
  'last 4 versions',
  'Firefox ESR',
  'not ie < 9', // React doesn't support IE8 anyway
];

module.exports.evergreen = evergreen;
module.exports.conservative = conservative;
module.exports.isEvergreenUserAgent = ctx => {
  if (ctx.useragent) {
    const ua = ctx.useragent;
    const rule = evergreen.find(r => r.match(new RegExp(ua.browser.name, 'i')));
    if (rule) {
      const [version] = rule.match(/\d+/);
      if (ua.browser.major >= version) {
        return true;
      }
    }
  }
  return false;
};
