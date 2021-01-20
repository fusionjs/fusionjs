// @flow
/* eslint-env node */

const t = require('assert');
const fs = require('fs');
const path = require('path');

const CDP = require('chrome-remote-interface');
const {spawn} = require('child_process');

const {promisify} = require('util');
const {cmd} = require('../utils.js');

const readFile = promisify(fs.readFile);

const countTests = require('./fixture/src/count-tests');

const jestConfigPath = require.resolve('fusion-cli/build/jest/jest-config.js');

const dir = path.resolve(__dirname, './fixture');

jest.setTimeout(20000);

test('`fusion test` passes', async () => {
  const response = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --match=passes`,
    {stdio: 'pipe'}
  );
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});

test('`fusion test` failure', async () => {
  try {
    await cmd(
      `test --dir=${dir} --configPath=${jestConfigPath} --match=fails`,
      {stdio: 'pipe'}
    );
    // $FlowFixMe
    t.fail('should not succeed');
  } catch (e) {
    t.equal(countTests(e.stderr), 2, 'ran 2 tests');
    t.notEqual(e.code, 0, 'exits with non-zero status code');
  }
});

test('`fusion test` all passing tests', async () => {
  const response = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --match=pass`,
    {stdio: 'pipe'}
  );
  t.equal(countTests(response.stderr), 4, 'ran 4 tests');
});

test('`fusion test` expected test passes in browser/node', async () => {
  const response = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --match=pass-`,
    {stdio: 'pipe'}
  );
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});

test('`fusion test` expected tests fail when run in browser/node', async () => {
  try {
    await cmd(
      `test --dir=${dir} --configPath=${jestConfigPath} --match=fail-`,
      {stdio: 'pipe'}
    );
    // $FlowFixMe
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.equal(countTests(e.stderr), 2, 'ran 2 tests');
  }
});

test('`fusion test --testFolder=integration` runs correct tests', async () => {
  const response = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --env=node --testFolder=__integration__`,
    {stdio: 'pipe'}
  );
  t.equal(countTests(response.stderr), 1, 'ran 1 test');
});

test('`fusion test --testMatch=**/__foo__/**/*js` runs correct tests', async () => {
  const response = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --env=node --testMatch=**/__foo__/**/*.js`,
    {stdio: 'pipe'}
  );
  t.equal(countTests(response.stderr), 1, 'ran 1 test');
});

test('`fusion test --testMatch=**/__foo__/**/*js,**/__integration__/**/*.js` runs correct tests', async () => {
  const response = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --env=node --testMatch=**/__foo__/**/*.js,**/__integration__/**/*.js`,
    {stdio: 'pipe'}
  );

  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});

test('`fusion test --testRegex=/__foo__/.*` runs correct tests', async () => {
  const response = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --env=node --testRegex=.*/__foo__/.*`,
    {stdio: 'pipe'}
  );
  t.equal(countTests(response.stderr), 1, 'ran 1 test');
});

test('`fusion test --testRegex and --testMatch cannot occur at same time', async () => {
  try {
    await cmd(
      `test --dir=${dir} --configPath=${jestConfigPath} --env=node --testMatch=**/__foo__/**/*.js --testRegex=.*/__foo__/.*`,
      {stdio: 'pipe'}
    );
  } catch (e) {
    t.ok('ok');
  }
});

test('`fusion test --testFolder and --testMatch cannot occur at same time', async () => {
  try {
    await cmd(
      `test --dir=${dir} --configPath=${jestConfigPath} --env=node --testMatch=**/__foo__/**/*.js --testFolder=__foo__`,
      {stdio: 'pipe'}
    );
    // $FlowFixMe
    t.fail('Should throw');
  } catch (e) {
    t.ok('ok');
  }
});

test('`fusion test --testFolder and --testRegex cannot occur at same time', async () => {
  try {
    await cmd(
      `test --dir=${dir} --configPath=${jestConfigPath} --env=node --testRegex=.*/__foo__/.* --testFolder=__foo__`,
      {stdio: 'pipe'}
    );
    // $FlowFixMe
    t.fail('Should throw');
  } catch (e) {
    t.ok('ok');
  }
});

test('`fusion test` snapshotting', async () => {
  const snapshotFile = path.join(
    dir,
    'src/__tests__/__snapshots__/snapshot-no-match.js.fixture'
  );
  const backupSnapshot = path.join(
    __dirname,
    'backup-snapshots/snapshot-no-match.js.fixture'
  );

  // Copy fixture to snapshot
  fs.createReadStream(snapshotFile).pipe(
    fs.createWriteStream(snapshotFile.replace(/fixture$/, 'snap'))
  );

  try {
    await cmd(
      `test --dir=${dir} --configPath=${jestConfigPath} --match=snapshot-no-match`,
      {stdio: 'pipe'}
    );
    // $FlowFixMe
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.equal(countTests(e.stderr), 2, 'ran 2 tests');
  }

  await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --match=snapshot-no-match -u`
  );

  const newSnapshotCode = await readFile(snapshotFile);
  const originalSnapshotCode = await readFile(backupSnapshot);
  t.notEqual(newSnapshotCode, originalSnapshotCode, 'snapshot is updated');

  fs.unlinkSync(snapshotFile.replace(/fixture$/, 'snap'));
}, 60000);

test('`fusion test` snapshotting with -u option', async () => {
  const snapshotFile = path.join(
    dir,
    'src/__tests__/__snapshots__/snapshot-no-match.js.fixture'
  );

  const backupSnapshot = path.join(
    __dirname,
    'backup-snapshots/snapshot-no-match.js.fixture'
  );

  // Copy fixture to snapshot
  fs.createReadStream(snapshotFile).pipe(
    fs.createWriteStream(snapshotFile.replace(/fixture$/, 'snap'))
  );

  try {
    await cmd(
      `test --dir=${dir} --configPath=${jestConfigPath} --match=snapshot-no-match`,
      {stdio: 'pipe'}
    );
    // $FlowFixMe
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.equal(countTests(e.stderr), 2, 'ran 2 tests');
  }

  await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --match=snapshot-no-match -u`
  );

  const newSnapshotCode = await readFile(snapshotFile);
  const originalSnapshotCode = await readFile(backupSnapshot);
  t.notEqual(newSnapshotCode, originalSnapshotCode, 'snapshot is updated');

  fs.unlinkSync(snapshotFile.replace(/fixture$/, 'snap'));
}, 60000);

test('`fusion test` snapshotting - enzyme serializer', async () => {
  const snapshotFile = path.join(
    dir,
    'src/__tests__/__snapshots__/snapshot-enzyme-no-match.js.fixture'
  );

  const backupSnapshot = path.join(
    __dirname,
    'backup-snapshots/snapshot-enzyme-no-match.js.fixture'
  );

  // Copy fixture to snapshot
  fs.createReadStream(snapshotFile).pipe(
    fs.createWriteStream(snapshotFile.replace(/fixture$/, 'snap'))
  );

  try {
    await cmd(
      `test --dir=${dir} --configPath=${jestConfigPath} --match=snapshot-enzyme-no-match`,
      {stdio: 'pipe'}
    );
    // $FlowFixMe
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.equal(countTests(e.stderr), 2, 'ran 2 tests');
  }

  await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --match=snapshot-enzyme-no-match -u`,
    {stdio: 'pipe'}
  );

  const newSnapshotCode = await readFile(snapshotFile);
  const originalSnapshotCode = await readFile(backupSnapshot);
  t.notEqual(newSnapshotCode, originalSnapshotCode, 'snapshot is updated');

  fs.unlinkSync(snapshotFile.replace(/fixture$/, 'snap'));
});

test('`fusion test` dynamic imports', async () => {
  const response = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --match=dynamic-imports`,
    {stdio: 'pipe'}
  );
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});

test('`fusion test` coverage', async () => {
  const response = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --coverage --match=passes --collectCoverageFrom=!**/istanbul-ignore-coverage-cli.js`,
    {stdio: 'pipe'}
  );

  t.equal(countTests(response.stderr), 2, 'ran 2 tests');

  // Look for something like coverage
  t.ok(response.stdout.includes('Uncovered Line #s'));

  // Files in __tests__ should not be included in coverage reports
  // Ensure that the following file exists, and is not in coverage.
  const testFile = 'pass-node.node.js';
  t.ok(fs.existsSync(`${__dirname}/fixture/src/__tests__/${testFile}`));
  t.ok(!response.stdout.includes(testFile));

  // This file is outside of src and should not be included in coverage
  t.ok(!response.stdout.includes('should-not-count-for-coverage.js'));

  // These files instruments the istanbul ignore annotation and should not be included in coverage
  t.ok(!response.stdout.includes('istanbul-ignore-coverage.js'));

  // Ignored by the CLI flag
  t.ok(!response.stdout.includes('istanbul-ignore-coverage-cli.js'));
});

test('`fusion test` coverage ignore multiple globs from collectCoverageFrom', async () => {
  const response = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --coverage --match=passes --collectCoverageFrom=!**/istanbul-ignore-coverage-cli.js --collectCoverageFrom=!**/class-props.js`,
    {stdio: 'pipe'}
  );

  // Ignored by the CLI flags
  t.ok(!response.stdout.includes('istanbul-ignore-coverage-cli.js'));
  t.ok(!response.stdout.includes('class-props.js'));
});

test('`fusion test` class properties', async () => {
  const response = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --match=class-props`,
    {stdio: 'pipe'}
  );
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});

test('`fusion test` cobertura coverage reports', async () => {
  const response = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --coverage --match=passes --env=jsdom`,
    {stdio: 'pipe'}
  );
  t.equal(countTests(response.stderr), 1, 'ran 1 tests');

  const cobertunaReport = await readFile(
    path.resolve(dir, 'coverage/cobertura-coverage.xml'),
    'utf8'
  );
  // Only a single report should be generated
  t.ok(cobertunaReport.includes('<line number="2" hits="1"/>'));
  t.ok(!cobertunaReport.includes('<line number="2" hits="2"/>'));

  t.ok(
    cobertunaReport.includes('not-imported-in-tests.js'),
    'report includes files not imported in tests'
  );

  // Assert that there's two hits when combining coverage
  const response2 = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --coverage --match=passes`,
    {stdio: 'pipe'}
  );
  t.equal(countTests(response2.stderr), 2, 'ran 2 tests');

  const combinedReport = await readFile(
    path.resolve(dir, 'coverage/cobertura-coverage.xml')
  );

  t.ok(combinedReport.includes('<line number="2" hits="2"/>'));
  t.ok(!combinedReport.includes('<line number="2" hits="1"/>'));

  t.ok(
    combinedReport.includes('not-imported-in-tests.js'),
    'report includes files not imported in tests'
  );
}, 60000);

test('`fusion test` environment variables', async () => {
  const response = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --match=environment-variables`,
    {
      env: Object.assign({}, process.env, {
        NODE_ENV: 'development',
      }),
      stdio: 'pipe',
    }
  );
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
});

test('`fusion test` writes results to disk based on env var', async () => {
  const testMetadataPath = path.join(dir, 'test-results.json');
  const response = await cmd(
    `test --dir=${dir} --configPath=${jestConfigPath} --match=passes`,
    {
      env: Object.assign({}, process.env, {
        FUSION_TEST_METADATA_PATH: testMetadataPath,
      }),
      stdio: 'pipe',
    }
  );
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
  const results = require(testMetadataPath);
  t.equal(results.numTotalTests, 2, 'two tests in results json');
  fs.unlinkSync(testMetadataPath);
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

test('`fusion test --env=jsdom,node`', async () => {
  const binPath = require.resolve('fusion-cli/bin/cli.js');
  const stderrLines = [];
  const child = spawn(
    'node',
    `${binPath} test --dir=${dir} --configPath=${jestConfigPath} --debug --env=jsdom,node  --match=passes`.split(
      ' '
    ),
    {stdio: 'pipe'}
  );

  const listenAddresses = {};
  let numResults = 0;

  let completed = new Promise(resolve => {
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
            t.ok('ok');
            resolve();
          }
        }
      });
  });

  // Poll until we get a listener message.
  async function checkStartedMessageCount(count) {
    // eslint-disable-next-line no-async-promise-executor
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

  await completed;

  t.ok(
    Object.keys(listenAddresses).length >= 1,
    'found a remote debug connection'
  );

  child.kill('SIGKILL');
}, 100000);
