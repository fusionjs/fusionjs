/* eslint-env node */

const fs = require('fs');
const path = require('path');
const test = require('tape');

const {promisify} = require('util');
const exec = promisify(require('child_process').exec);

const readFile = promisify(fs.readFile);

const countTests = require('../fixtures/test-jest-app/count-tests');

const runnerPath = require.resolve('../../bin/cli-runner');

test('`fusion test-app` passes', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test-app --dir=${dir} --configPath=../../../build/jest-config.js --match=passes`;

  const cmd = `require('${runnerPath}').run('${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
  t.end();
});

test('`fusion test-app` failure', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test-app --dir=${dir} --configPath=../../../build/jest-config.js --match=fails`;

  const cmd = `require('${runnerPath}').run('${args}')`;
  try {
    await exec(`node -e "${cmd}"`);
    t.fail('should not succeed');
  } catch (e) {
    t.equal(countTests(e.message), 2, 'ran 2 tests');
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.end();
  }
});

test('`fusion test-app` all passing tests', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test-app --dir=${dir} --configPath=../../../build/jest-config.js --match=pass`;

  const cmd = `require('${runnerPath}').run('${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 4, 'ran 4 tests');
  t.end();
});

test('`fusion test-app` expected test passes in browser/node', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test-app --dir=${dir} --configPath=../../../build/jest-config.js --match=pass-`;

  const cmd = `require('${runnerPath}').run('${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');

  t.end();
});

test('`fusion test-app` expected tests fail when run in browser/node', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test-app --dir=${dir} --configPath=../../../build/jest-config.js --match=fail-`;

  const cmd = `require('${runnerPath}').run('${args}')`;
  try {
    await exec(`node -e "${cmd}"`);
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.equal(countTests(e.message), 2, 'ran 2 tests');
    t.end();
  }
});

test('`fusion test-app --testFolder=integration` runs correct tests', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test-app --dir=${dir} --configPath=../../../build/jest-config.js --env=node --testFolder=__integration__`;

  const cmd = `require('${runnerPath}').run('${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 1, 'ran 1 test');

  t.end();
});

test('`fusion test-app` snapshotting', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test-app --dir=${dir} --configPath=../../../build/jest-config.js --match=snapshot-no-match`;

  const snapshotFile =
    __dirname +
    '/../fixtures/test-jest-app/__tests__/__snapshots__/snapshot-no-match.js.snap';
  const backupSnapshot =
    __dirname + '/../fixtures/snapshots/snapshot-no-match.js.snap';

  const cmd = `require('${runnerPath}').run('${args}')`;
  try {
    await exec(`node -e "${cmd}"`);
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.equal(countTests(e.message), 2, 'ran 2 tests');
  }

  const updateSnapshot = `require('${runnerPath}').run('${args} --updateSnapshot')`;
  await exec(`node -e "${updateSnapshot}"`);

  const newSnapshotCode = await readFile(snapshotFile);
  const originalSnapshotCode = await readFile(backupSnapshot);
  t.notEqual(newSnapshotCode, originalSnapshotCode, 'snapshot is updated');

  // Restore the failing snapshot
  fs.createReadStream(backupSnapshot).pipe(fs.createWriteStream(snapshotFile));

  t.end();
});

test('`fusion test-app` snapshotting - enzyme serializer', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test-app --dir=${dir} --configPath=../../../build/jest-config.js --match=snapshot-enzyme-no-match`;

  const snapshotFile =
    __dirname +
    '/../fixtures/test-jest-app/__tests__/__snapshots__/snapshot-enzyme-no-match.js.snap';
  const backupSnapshot =
    __dirname + '/../fixtures/snapshots/snapshot-enzyme-no-match.js.snap';

  const cmd = `require('${runnerPath}').run('${args}')`;
  try {
    await exec(`node -e "${cmd}"`);
    t.fail('should not succeed');
  } catch (e) {
    t.notEqual(e.code, 0, 'exits with non-zero status code');
    t.equal(countTests(e.message), 2, 'ran 2 tests');
  }

  const updateSnapshot = `require('${runnerPath}').run('${args} --updateSnapshot')`;
  await exec(`node -e "${updateSnapshot}"`);

  const newSnapshotCode = await readFile(snapshotFile);
  const originalSnapshotCode = await readFile(backupSnapshot);
  t.notEqual(newSnapshotCode, originalSnapshotCode, 'snapshot is updated');

  // Restore the failing snapshot
  fs.createReadStream(backupSnapshot).pipe(fs.createWriteStream(snapshotFile));

  t.end();
});

test('`fusion test-app` dynamic imports', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test-app --dir=${dir} --configPath=../../../build/jest-config.js --match=dynamic-imports`;

  const cmd = `require('${runnerPath}').run('${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');
  t.end();
});

test('`fusion test-app` coverage', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test-app --dir=${dir} --configPath=../../../build/jest-config.js --coverage --match=passes`;

  const cmd = `require('${runnerPath}').run('${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');

  // Look for something like coverage
  t.ok(response.stdout.includes('Uncovered Lines'));
  t.end();
});

test('`fusion test-app` merge coverage reports', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test-app --dir=${dir} --configPath=../../../build/jest-config.js --coverage --match=passes`;

  const cmd = `require('${runnerPath}').run('${args} --env=jsdom')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 1, 'ran 1 tests');

  const cobertunaReport = await readFile(
    path.resolve(dir, 'coverage/cobertura-coverage.xml')
  );
  // Only a single report should be generated
  t.ok(cobertunaReport.includes('<line number="1" hits="1"/>'));
  t.ok(!cobertunaReport.includes('<line number="1" hits="2"/>'));

  // Assert that there's two hits when combining coverage
  const cmd2 = `require('${runnerPath}').run('${args}')`;
  const response2 = await exec(`node -e "${cmd2}"`);
  t.equal(countTests(response2.stderr), 2, 'ran 2 tests');

  const combinedReport = await readFile(
    path.resolve(dir, 'coverage/cobertura-coverage.xml')
  );
  t.ok(combinedReport.includes('<line number="1" hits="2"/>'));
  t.ok(!combinedReport.includes('<line number="1" hits="1"/>'));
  t.end();
});

test('`fusion test-app` environment variables', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-app');
  const args = `test-app --dir=${dir} --configPath=../../../build/jest-config.js --match=environment-variables`;

  const cmd = `require('${runnerPath}').run('${args}')`;
  const response = await exec(`node -e "${cmd}"`, {
    env: Object.assign({}, process.env, {
      NODE_ENV: 'development',
    }),
  });
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');

  t.end();
});

test('`fusion test-app` uses .fusionjs.js', async t => {
  const dir = path.resolve(__dirname, '../fixtures/test-jest-babel');
  const args = `test-app --dir=${dir} --configPath=../../../build/jest-config.js`;

  const cmd = `require('${runnerPath}').run('${args}')`;
  const response = await exec(`node -e "${cmd}"`);
  t.equal(countTests(response.stderr), 2, 'ran 2 tests');

  t.end();
});
