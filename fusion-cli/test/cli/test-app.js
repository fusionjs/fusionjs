/* eslint-env node */

const path = require('path');
const test = require('tape');

const {promisify} = require('util');
const exec = promisify(require('child_process').exec);

const runnerPath = require.resolve('../../bin/cli-runner');

test('`fusion test-app` passes', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test-app --dir=${dir} --configPath=../../../build/jest-config.js --match=passes`;

  const cmd = `require('${runnerPath}').run('${args}')`;
  await exec(`node -e "${cmd}"`);

  t.end();
});

test('`fusion test-app` failure', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test-app --dir=${dir} --configPath=../../../build/jest-config.js --match=fails`;

  const cmd = `require('${runnerPath}').run('${args}')`;
  try {
    await exec(`node -e "${cmd}"`);
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.end();
  }
});
