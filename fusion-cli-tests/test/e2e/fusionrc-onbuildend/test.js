// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const util = require('util');
const fs = require('fs');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const exists = util.promisify(fs.exists);
const unlink = util.promisify(fs.unlink);

const dev = require('../setup.js');

const dir = path.resolve(__dirname, './fixture');
const app = dev(dir);

const statsFile = path.resolve(dir, 'stats-output.json');

beforeAll(() => app.setup(), 100000);
afterAll(() => app.teardown());

test('`fusion dev` calls onBuildEnd', async () => {
  // build should be done now
  t.ok(await tryTimes(() => exists(statsFile), 5));

  let statsOutput = JSON.parse(await readFile(statsFile, 'utf-8'));
  t.ok(Array.isArray(statsOutput));
  statsOutput = statsOutput.map(stat => {
    // initial build
    expect(stat.isIncrementalBuild).toBe(false);
    stat.path = 'path';
    stat.buildTime = 'buildTime';
    return stat;
  });
  expect(statsOutput).toMatchInlineSnapshot(`
    Array [
      Object {
        "buildTime": "buildTime",
        "command": "dev",
        "isIncrementalBuild": false,
        "minify": true,
        "mode": "development",
        "path": "path",
        "skipSourceMaps": false,
        "target": "client-modern",
        "watch": true,
      },
      Object {
        "buildTime": "buildTime",
        "command": "dev",
        "isIncrementalBuild": false,
        "minify": true,
        "mode": "development",
        "path": "path",
        "skipSourceMaps": false,
        "target": "server",
        "watch": true,
      },
    ]
  `);

  // Clear build stats
  await unlink(statsFile);

  // Make change for incremental build
  const mainContent = await readFile(path.resolve(dir, 'src/main.js'), 'utf-8');
  const updatedContent = mainContent.replace(
    'class-name',
    'updated-class-name'
  );
  await writeFile(path.resolve(dir, 'src/main.js'), updatedContent);

  t.ok(await tryTimes(() => exists(statsFile), 5));

  let incStatsOutput = JSON.parse(await readFile(statsFile, 'utf-8'));
  t.ok(Array.isArray(incStatsOutput));
  incStatsOutput = incStatsOutput.map(stat => {
    // subsequent build is incremental
    expect(stat.isIncrementalBuild).toBe(true);
    stat.path = 'path';
    stat.buildTime = 'buildTime';
    return stat;
  });
  expect(incStatsOutput).toMatchInlineSnapshot(`
    Array [
      Object {
        "buildTime": "buildTime",
        "command": "dev",
        "isIncrementalBuild": true,
        "minify": true,
        "mode": "development",
        "path": "path",
        "skipSourceMaps": false,
        "target": "client-modern",
        "watch": true,
      },
      Object {
        "buildTime": "buildTime",
        "command": "dev",
        "isIncrementalBuild": true,
        "minify": true,
        "mode": "development",
        "path": "path",
        "skipSourceMaps": false,
        "target": "server",
        "watch": true,
      },
    ]
  `);
}, 100000);

// Wait for a function to return true, retrying every second
async function tryTimes(fn, counter) {
  if (counter === 0) {
    throw new Error('tryTimes: `fn` never returned true');
  }
  const result = await fn();
  if (!result) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(tryTimes(fn, --counter));
      }, 1000);
    });
  }
  return result;
}
