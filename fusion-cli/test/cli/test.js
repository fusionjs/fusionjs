/* eslint-env node */

const path = require('path');
const test = require('tape');
const {cmd} = require('../run-command');

test('"fusion test" exits w/ unhandled promise rejection in server tests', async t => {
  const dir = path.resolve(
    __dirname,
    '../fixtures/unhandled-promise-rejection-server'
  );
  try {
    await cmd(`test --dir=${dir}`, {
      env: Object.assign({}, process.env, {
        NODE_ENV: 'production',
      }),
      stdio: 'pipe',
    });
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.ok(e.stdout.includes('server async error'), 'error is logged');
  }

  t.end();
});

test('`fusion test` exits w/ unhandled promise rejection in browser tests', async t => {
  const dir = path.resolve(
    __dirname,
    '../fixtures/unhandled-promise-rejection-browser'
  );
  try {
    await cmd(`test --dir=${dir}`, {
      stdio: 'pipe',
    });
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.ok(e.stdout.includes('browser async error'), 'error is logged');
  }

  t.end();
});
