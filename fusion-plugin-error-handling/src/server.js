/* eslint-env node */

import {html} from 'fusion-core';
import bodyParser from 'koa-bodyparser';
import assert from 'assert';
import EnvVars from 'fusion-cli/plugins/environment-variables-plugin';

const types = {
  browser: 'browser',
  request: 'request',
  server: 'server',
};

export default ({onError, CsrfProtection}) => {
  assert(typeof onError === 'function', '{onError} must be a function');
  if (CsrfProtection) CsrfProtection.ignore(EnvVars().of().prefix + '/_errors');
  const err = async e => {
    await onError(e, types.server);
    process.exit(1);
  };
  process.once('uncaughtException', err);
  process.once('unhandledRejection', err);
  const parseBody = bodyParser();
  async function middleware(ctx, next) {
    if (ctx.element) {
      // Here, we use GET instead of POST to avoid the need for a CSRF token
      // We also avoid using fusion-plugin-universal-event batching because
      // we want to collect errors even if the vendor bundle fails to load
      // (e.g. due to a network timeout)
      // All errors should be funneled to this handler (e.g. errors in
      // addEventListener handlers, promise rejections, react render errors, etc),
      // ideally by calling `window.onerror` directly with an Error object
      // (which provides more robust stack traces across browsers), or via `throw`
      const script = html`
<script nonce="${ctx.nonce}">
onerror = function(m,s,l,c,e) {
  if (e.__handled) return;
  var error = {};
  Object.getOwnPropertyNames(e).forEach(function(key) {
    error[key] = e[key];
  });
  var x = new XMLHttpRequest;
  x.open('POST', '${ctx.prefix}/_errors');
  x.setRequestHeader('Content-Type', 'application/json')
  x.send(JSON.stringify({message: m, source: s, line: l, col: c, error: error}));
  e.__handled = true;
};
</script>`;
      ctx.body.head.unshift(script);
    } else if (ctx.path === ctx.prefix + '/_errors') {
      await parseBody(ctx, () => Promise.resolve());
      await onError(ctx.request.body, types.browser);
      ctx.body = {ok: 1};
    }
    return next().catch(async e => {
      await onError(e, types.request);
      if (ctx.app) ctx.app.emit('error', e, ctx);
      throw e;
    });
  }
  return middleware;
};
