// @flow
/* eslint-env node */

const t = require('assert');

const path = require('path');

const {promisify} = require('util');
const exec = promisify(require('child_process').exec);

const countTests = require('../test-jest-app/fixture/src/count-tests');

const runnerPath = require.resolve('fusion-cli/bin/cli-runner');
const jestConfigPath = require.resolve('fusion-cli/build/jest/jest-config.js');

const dir = path.resolve(__dirname, './fixture');

jest.setTimeout(10000);

test('`fusion test` uses .fusionjs.js', async () => {
  const args = `test --dir=${dir} --configPath=${jestConfigPath}`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;

  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});
