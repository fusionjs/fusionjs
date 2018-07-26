/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const fs = require('fs');
const path = require('path');
const test = require('tape');

const CDP = require('chrome-remote-interface');
const {promisify} = require('util');
const exec = promisify(require('child_process').exec);
const spawn = require('child_process').spawn;

const readFile = promisify(fs.readFile);

const countTests = require('../fixtures/test-jest-app/src/count-tests');

const runnerPath = require.resolve('../../bin/cli-runner');

test('`fusion test` passes', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test --dir=${dir} --configPath=../../../build/jest/jest-config.js --match=passes`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
  t.end();
});

test('`fusion test` failure', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test --dir=${dir} --configPath=../../../build/jest/jest-config.js --match=fails`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  try {
    await exec(`node -e "${cmd}"`);
    t.fail('should not succeed');
  } catch (e) {
    t.equal(countTests(e.message), 2, 'ran 2 tests');
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.end();
  }
});

test('`fusion test` all passing tests', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test --dir=${dir} --configPath=../../../build/jest/jest-config.js --match=pass`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 4, 'ran 4 tests');
  t.end();
});

test('`fusion test` expected test passes in browser/node', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test --dir=${dir} --configPath=../../../build/jest/jest-config.js --match=pass-`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');

  t.end();
});

test('`fusion test` expected tests fail when run in browser/node', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test --dir=${dir} --configPath=../../../build/jest/jest-config.js --match=fail-`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  try {
    await exec(`node -e "${cmd}"`);
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.equal(countTests(e.message), 2, 'ran 2 tests');
    t.end();
  }
});

test('`fusion test --testFolder=integration` runs correct tests', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test --dir=${dir} --configPath=../../../build/jest/jest-config.js --env=node --testFolder=__integration__`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 1, 'ran 1 test');

  t.end();
});

test('`fusion test` snapshotting', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test --dir=${dir} --configPath=../../../build/jest/jest-config.js --match=snapshot-no-match`;

  const snapshotFile =
    __dirname +
    '/../fixtures/test-jest-app/src/__tests__/__snapshots__/snapshot-no-match.js.fixture';
  const backupSnapshot =
    __dirname + '/../fixtures/snapshots/snapshot-no-match.js.fixture';

  // Copy fixture to snapshot
  fs.createReadStream(snapshotFile).pipe(
    fs.createWriteStream(snapshotFile.replace(/fixture$/, 'snap'))
  );

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  try {
    await exec(`node -e "${cmd}"`);
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.equal(countTests(e.message), 2, 'ran 2 tests');
  }

  const updateSnapshot = `require('${runnerPath}').run('node ${runnerPath} ${args} --updateSnapshot')`;
  await exec(`node -e "${updateSnapshot}"`);

  const newSnapshotCode = await readFile(snapshotFile);
  const originalSnapshotCode = await readFile(backupSnapshot);
  t.notEqual(newSnapshotCode, originalSnapshotCode, 'snapshot is updated');

  fs.unlinkSync(snapshotFile.replace(/fixture$/, 'snap'));

  t.end();
});

test('`fusion test` snapshotting with -u option', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test --dir=${dir} --configPath=../../../build/jest/jest-config.js --match=snapshot-no-match`;

  const snapshotFile =
    __dirname +
    '/../fixtures/test-jest-app/src/__tests__/__snapshots__/snapshot-no-match.js.fixture';
  const backupSnapshot =
    __dirname + '/../fixtures/snapshots/snapshot-no-match.js.fixture';

  // Copy fixture to snapshot
  fs.createReadStream(snapshotFile).pipe(
    fs.createWriteStream(snapshotFile.replace(/fixture$/, 'snap'))
  );

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  try {
    await exec(`node -e "${cmd}"`);
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.equal(countTests(e.message), 2, 'ran 2 tests');
  }

  const updateSnapshot = `require('${runnerPath}').run('node ${runnerPath} ${args} -u')`;
  await exec(`node -e "${updateSnapshot}"`);

  const newSnapshotCode = await readFile(snapshotFile);
  const originalSnapshotCode = await readFile(backupSnapshot);
  t.notEqual(newSnapshotCode, originalSnapshotCode, 'snapshot is updated');

  fs.unlinkSync(snapshotFile.replace(/fixture$/, 'snap'));

  t.end();
});

test('`fusion test` snapshotting - enzyme serializer', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test --dir=${dir} --configPath=../../../build/jest/jest-config.js --match=snapshot-enzyme-no-match`;

  const snapshotFile =
    __dirname +
    '/../fixtures/test-jest-app/src/__tests__/__snapshots__/snapshot-enzyme-no-match.js.fixture';
  const backupSnapshot =
    __dirname + '/../fixtures/snapshots/snapshot-enzyme-no-match.js.fixture';

  // Copy fixture to snapshot
  fs.createReadStream(snapshotFile).pipe(
    fs.createWriteStream(snapshotFile.replace(/fixture$/, 'snap'))
  );

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  try {
    await exec(`node -e "${cmd}"`);
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.equal(countTests(e.message), 2, 'ran 2 tests');
  }

  const updateSnapshot = `require('${runnerPath}').run('node ${runnerPath} ${args} --updateSnapshot')`;
  await exec(`node -e "${updateSnapshot}"`);

  const newSnapshotCode = await readFile(snapshotFile);
  const originalSnapshotCode = await readFile(backupSnapshot);
  t.notEqual(newSnapshotCode, originalSnapshotCode, 'snapshot is updated');

  fs.unlinkSync(snapshotFile.replace(/fixture$/, 'snap'));

  t.end();
});

test('`fusion test` dynamic imports', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test --dir=${dir} --configPath=../../../build/jest/jest-config.js --match=dynamic-imports`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
  t.end();
});

test('`fusion test` coverage', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test --dir=${dir} --configPath=../../../build/jest/jest-config.js --coverage --match=passes`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');

  // Look for something like coverage
  t.ok(response.stdout.includes('Uncovered Line #s'));

  t.ok(!response.stdout.includes('should-not-count-for-coverage.js'));
  t.end();
});

test('`fusion test` cobertura coverage reports', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test --dir=${dir} --configPath=../../../build/jest/jest-config.js --coverage --match=passes`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args} --env=jsdom')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 1, 'ran 1 tests');

  const cobertunaReport = await readFile(
    path.resolve(dir, 'coverage/cobertura-coverage.xml')
  );
  // Only a single report should be generated
  t.ok(cobertunaReport.includes('<line number="1" hits="1"/>'));
  t.ok(!cobertunaReport.includes('<line number="1" hits="2"/>'));

  t.ok(
    cobertunaReport.includes('not-imported-in-tests.js'),
    'report includes files not imported in tests'
  );

  // Assert that there's two hits when combining coverage
  const cmd2 = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response2 = await exec(`node -e "${cmd2}"`);
  t.equal(countTests(response2.stderr), 2, 'ran 2 tests');

  const combinedReport = await readFile(
    path.resolve(dir, 'coverage/cobertura-coverage.xml')
  );

  t.ok(combinedReport.includes('<line number="1" hits="2"/>'));
  t.ok(!combinedReport.includes('<line number="1" hits="1"/>'));

  t.ok(
    combinedReport.includes('not-imported-in-tests.js'),
    'report includes files not imported in tests'
  );
  t.end();
});

test('`fusion test` environment variables', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test --dir=${dir} --configPath=../../../build/jest/jest-config.js --match=environment-variables`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`, {
    env: Object.assign({}, process.env, {
      NODE_ENV: 'development',
    }),
  });
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');

  t.end();
});

test('`fusion test` writes results to disk based on env var', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test --dir=${dir} --configPath=../../../build/jest/jest-config.js --match=passes`;

  const testMetadataPath = path.join(dir, 'test-results.json');

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`, {
    env: Object.assign({}, process.env, {
      FUSION_TEST_METADATA_PATH: testMetadataPath,
    }),
  });
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
  const results = require(testMetadataPath);
  t.equal(results.numTotalTests, 2, 'two tests in results json');
  fs.unlinkSync(testMetadataPath);
  t.end();
});

test('`fusion test` uses .fusionjs.js', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-babel');
  const args = `test --dir=${dir} --configPath=../../../build/jest/jest-config.js`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');

  t.end();
});

async function triggerCodeStep() {
  return new Promise(resolve => {
    CDP({port: '9229'}, async client => {
      const {Runtime} = client;
      await Runtime.runIfWaitingForDebugger();
      await client.close();
      resolve();
    }).on('error', err => {
      throw err;
    });
  });
}

test('`fusion test --debug --env=jsdom,node`', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test --dir=${dir} --configPath=../../../build/jest/jest-config.js --debug --env=jsdom,node  --match=passes`;

  const cmd = `require('${runnerPath}').run('node ${runnerPath} ${args}')`;
  const stderrLines = [];
  const child = spawn('node', ['-e', cmd]);

  const listenAddresses = {};
  let numResults = 0;
  child.stderr &&
    child.stderr.on('data', data => {
      const line = data.toString();
      // eslint-disable-next-line no-console
      console.log(` - received spawn line: ${line}`);
      stderrLines.push(line);
      // Keep track of all addresses that we start listening to.
      if (line.startsWith('Debugger listening on ws')) {
        listenAddresses[line] = true;
      }
      // Wait until we have results for both environments before ending the test.
      if (/Tests:.*2\s+passed,\s+2\s+total/.test(line)) {
        numResults += 1;
        if (numResults == 1) {
          t.end();
        }
      }
    });

  // Poll until we get a listener message.
  async function checkStartedMessageCount(count) {
    return new Promise(async resolve => {
      while (Object.keys(listenAddresses).length < count) {
        await new Promise(r => setTimeout(r, 100));
      }
      resolve();
    });
  }

  // Step through the environment
  await checkStartedMessageCount(1);
  await triggerCodeStep();

  t.ok(
    Object.keys(listenAddresses).length >= 1,
    'found a remote debug connection'
  );

  child.kill();
});
