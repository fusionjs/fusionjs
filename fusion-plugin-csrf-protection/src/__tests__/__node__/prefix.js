import test from 'tape-cup';
import CsrfToken from '../../server';

test('works w/ prefix', async t => {
  const state = {};
  const Session = {
    of() {
      return {
        set(key, value) {
          return (state[key] = value);
        },
        get(key) {
          return state[key];
        },
      };
    },
  };
  const Csrf = CsrfToken({Session});
  t.equals(typeof Csrf.of().ignore, 'function');
  const headers = {};
  const ctx = {
    method: 'POST',
    path: '/prefix/csrf-token',
    prefix: '/prefix',
    set(key, value) {
      headers[key] = value;
    },
  };
  await Csrf.middleware(ctx, () => Promise.resolve());
  t.ok(headers['x-csrf-token'], 'has token');
  t.equals(ctx.status, 200, 'has right status');
  t.equals(ctx.body, '', 'has empty body');

  const context = {
    method: 'POST',
    path: '/prefix/test',
    prefix: '/prefix',
    headers: {'x-csrf-token': headers['x-csrf-token']},
    status: 200,
  };
  await Csrf.middleware(context, () => Promise.resolve());
  t.equals(context.status, 200, 'has valid token');

  t.end();
});

test('fails with wrong token w/ prefix', async t => {
  const state = {};
  const Session = {
    of() {
      return {
        set(key, value) {
          return (state[key] = value);
        },
        get(key) {
          return state[key];
        },
      };
    },
  };
  const Csrf = CsrfToken({Session});
  const ctx = {
    method: 'POST',
    path: '/prefix/test',
    prefix: '/prefix',
    headers: {'x-csrf-token': 'invalid'},
    status: 200,
  };
  await Csrf.middleware(ctx, () => Promise.resolve());
  t.notEquals(ctx.status, 200, 'errors when invalid token');

  t.end();
});

test('fails with no token w/ prefix', async t => {
  const state = {};
  const Session = {
    of() {
      return {
        set(key, value) {
          return (state[key] = value);
        },
        get(key) {
          return state[key];
        },
      };
    },
  };
  const Csrf = CsrfToken({Session});
  const ctx = {
    method: 'POST',
    path: '/prefix/test',
    prefix: '/prefix',
    headers: {},
    status: 200,
  };
  await Csrf.middleware(ctx, () => Promise.resolve());
  t.notEquals(ctx.status, 200, 'errors when invalid token');

  t.end();
});

test('fails with expired token w/ prefix', async t => {
  const state = {};
  const Session = {
    of() {
      return {
        set(key, value) {
          return (state[key] = value);
        },
        get(key) {
          return state[key];
        },
      };
    },
  };
  const Csrf = CsrfToken({Session, expire: 1});
  const headers = {};
  const ctx = {
    method: 'POST',
    path: '/prefix/csrf-token',
    prefix: '/prefix',
    set(key, value) {
      headers[key] = value;
    },
  };
  await Csrf.middleware(ctx, () => Promise.resolve());

  setTimeout(async () => {
    const context = {
      method: 'POST',
      path: '/prefix/test',
      prefix: '/prefix',
      headers: {'x-csrf-token': headers['x-csrf-token']},
      status: 200,
    };
    await Csrf.middleware(context, () => Promise.resolve());
    t.notEquals(context.status, 200, 'errors when expired token');

    t.end();
  }, 2000); // wait longer than expiry
});
