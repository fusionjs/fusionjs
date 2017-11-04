import test from 'tape-cup';
import CsrfToken from '../../index';

test('exposes right methods', t => {
  const Csrf = CsrfToken();
  const csrf = Csrf.of();
  t.equal(typeof csrf.fetch, 'function', 'instance fetch function');
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
