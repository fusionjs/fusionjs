/* eslint-env node */

const path = require('path');
const test = require('tape');

const {promisify} = require('util');
const exec = promisify(require('child_process').exec);

const runnerPath = require.resolve('../../bin/cli-runner');

test('`fusion test` exits w/ unhandled promise rejection in server tests', async t => {
  const dir = path.resolve(
    __dirname,
    '../fixtures/unhandled-promise-rejection-server'
  );
  const args = `test --dir=${dir}`;

  const cmd = `require('${runnerPath}').run('${args}')`;
  try {
    await exec(`node -e "${cmd}"`, {
      env: Object.assign({}, process.env, {
        NODE_ENV: 'production',
      }),
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
  const args = `test --dir=${dir}`;

  const cmd = `require('${runnerPath}').run('${args}')`;
  try {
    await exec(`node -e "${cmd}"`);
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.ok(e.stdout.includes('browser async error'), 'error is logged');
  }

  t.end();
});
