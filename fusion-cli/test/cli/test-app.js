/* eslint-env node */

const fs = require('fs');
const path = require('path');
const test = require('tape');

const {promisify} = require('util');
const exec = promisify(require('child_process').exec);

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

  const newSnapshotCode = fs.readFileSync(snapshotFile);
  const originalSnapshotCode = fs.readFileSync(backupSnapshot);
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

  const newSnapshotCode = fs.readFileSync(snapshotFile);
  const originalSnapshotCode = fs.readFileSync(backupSnapshot);
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
