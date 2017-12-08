/* eslint-env browser */
import test from 'tape-cup';
import App from 'fusion-core';
import CsrfToken from '../../index';

test('exposes right methods', t => {
  const Csrf = CsrfToken();
  const csrf = Csrf.of();
  t.equal(typeof csrf.fetch, 'function', 'instance fetch function');
  t.end();
});

test('includes routePrefix if exists', async t => {
  window.__ROUTE_PREFIX__ = '/something';
  let called = 0;
  const expectedUrls = ['/something/csrf-token', '/something/hello'];
  const fetch = (url, args) => {
    called++;
    t.equal(url, expectedUrls.shift());
    return Promise.resolve({
      url,
      args,
      headers: {
        get(key) {
          if (key === 'x-csrf-token') {
            return Math.round(Date.now() / 1000) + '-test';
          }
        },
      },
    });
  };
  const app = new App('element', el => el);
  const csrf = app.plugin(CsrfToken, {fetch}).of();
  const {url, args} = await csrf.fetch('/hello', {method: 'POST'});
  t.equals(called, 2, 'preflight works');
  t.equals(url, '/something/hello', 'ok url');
  t.equals(args.credentials, 'same-origin', 'ok credentials');
  t.equals(args.headers['x-csrf-token'].split('-')[1], 'test', 'ok token');
  delete window.__ROUTE_PREFIX__;
  t.end();
});

test('supports passing in route prefix', async t => {
  let called = 0;
  const expectedUrls = ['/prefix/csrf-token', '/prefix/hello'];
  const fetch = (url, args) => {
    called++;
    t.equal(url, expectedUrls.shift());
    return Promise.resolve({
      url,
      args,
      headers: {
        get(key) {
          if (key === 'x-csrf-token') {
            return Math.round(Date.now() / 1000) + '-test';
          }
        },
      },
    });
  };
  const app = new App('element', el => el);
  const csrf = app.plugin(CsrfToken, {fetch, routePrefix: '/prefix'}).of();
  const {url, args} = await csrf.fetch('/hello', {method: 'POST'});
  t.equals(called, 2, 'preflight works');
  t.equals(url, '/prefix/hello', 'ok url');
  t.equals(args.credentials, 'same-origin', 'ok credentials');
  t.equals(args.headers['x-csrf-token'].split('-')[1], 'test', 'ok token');
  t.end();
});

test('supports getting initial token from dom element', async t => {
  const el = document.createElement('div');
  el.setAttribute('id', '__CSRF_TOKEN__');
  el.setAttribute('type', 'application/json');
  el.textContent = JSON.stringify(
    `${Math.round(
      Date.now() / 1000
    )}-\u003C\u002Fscript\u003Etoken\u003Cscript\u003E`
  );
  document.body.appendChild(el);
  let called = 0;
  const expectedUrls = ['/hello'];
  const fetch = (url, args) => {
    called++;
    t.equal(url, expectedUrls.shift());
    return Promise.resolve({
      url,
      args,
      headers: {
        get(key) {
          if (key === 'x-csrf-token') {
            return Math.round(Date.now() / 1000) + '-lol';
          }
        },
      },
    });
  };
  const app = new App('element', el => el);
  const csrf = app.plugin(CsrfToken, {fetch}).of();
  const {url, args} = await csrf.fetch('/hello', {method: 'POST'});
  t.equals(called, 1, 'does not preflight if deserializing token from html');
  t.equals(url, '/hello', 'ok url');
  t.equals(args.credentials, 'same-origin', 'ok credentials');
  t.equals(
    args.headers['x-csrf-token'].split('-')[1],
    '</script>token<script>',
    'unescapes the token correctly'
  );
  document.body.removeChild(el);
  t.end();
});

test('defaults method to GET', async t => {
  let called = 0;
  const expectedUrls = ['/hello'];
  const fetch = (url, args) => {
    called++;
    t.equal(url, expectedUrls.shift());
    return Promise.resolve({
      url,
      args,
      headers: {
        get(key) {
          if (key === 'x-csrf-token') {
            return Math.round(Date.now() / 1000) + '-test';
          }
        },
      },
    });
  };
  const app = new App('element', el => el);
  const csrf = app.plugin(CsrfToken, {fetch}).of();
  const {url, args} = await csrf.fetch('/hello');
  t.equals(called, 1, 'does not preflight for GET requests');
  t.equals(url, '/hello', 'ok url');
  t.notok(args.headers['x-csrf-token'], 'does not send token on GET requests');
  t.end();
});

test('fetch preflights if no token', t => {
  let called = 0;
  const fetch = (url, args) => {
    called++;
    return Promise.resolve({
      url,
      args,
      headers: {
        get(key) {
          if (key === 'x-csrf-token') {
            return Math.round(Date.now() / 1000) + '-test';
          }
        },
      },
    });
  };
  const csrf = CsrfToken({fetch}).of();
  csrf.fetch('/test', {method: 'POST'}).then(({url, args}) => {
    t.equals(called, 2, 'preflight works');
    t.equals(url, '/test', 'ok url');
    t.equals(args.credentials, 'same-origin', 'ok credentials');
    t.equals(args.headers['x-csrf-token'].split('-')[1], 'test', 'ok token');

    return csrf.fetch('/foo', {method: 'POST'}).then(() => {
      t.equals(called, 3, 'no preflight if token exists');
      t.end();
    });
  });
});

test('fetch preflights if token is expired', t => {
  let called = 0;
  const fetch = (url, args) => {
    called++;
    return Promise.resolve({
      url,
      args,
      headers: {
        get(key) {
          if (key === 'x-csrf-token') {
            return Math.round(Date.now() / 1000) + '-test';
          }
        },
      },
    });
  };
  const csrf = CsrfToken({fetch, expire: 1}).of();
  csrf.fetch('/test', {method: 'POST'}).then(({url, args}) => {
    t.equals(called, 2, 'preflight works');
    t.equals(url, '/test', 'ok url');
    t.equals(args.credentials, 'same-origin', 'ok credentials');
    t.equals(args.headers['x-csrf-token'].split('-')[1], 'test', 'ok token');

    setTimeout(() => {
      csrf.fetch('/foo', {method: 'POST'}).then(() => {
        t.equals(called, 4, 'preflight if token expired');
        t.end();
      });
    }, 2000); // wait longer than expiration time
  });
});
