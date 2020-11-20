// @flow
/* eslint-env node */

const t = require('assert');

const path = require('path');

const {cmd} = require('../utils.js');

const countTests = require('../test-jest-app/fixture/src/count-tests');

const jestConfigPath = require.resolve('fusion-cli/build/jest/jest-config.js');

const dir = path.resolve(__dirname, './fixture');

jest.setTimeout(10000);

test('`fusion test` uses .fusionjs.js', async () => {
  const response = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath}`,
    {stdio: 'pipe'}
  );
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});
