// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const util = require('util');
const fs = require('fs');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const dev = require('../setup.js');

const dir = path.resolve(__dirname, './fixture');
const app = dev(dir);

const statsFile = path.resolve(dir, 'stats-output.json');

async function clearStats() {
  await writeFile(statsFile, JSON.stringify([]));
}

async function readStats() {
  try {
    return JSON.parse(await readFile(statsFile));
  } catch (e) {
    return [];
  }
}

beforeAll(async () => {
  // This is crucial for the test to pass in CI inside docker container.
  // Upon write to the dir the whole tree gets new btime, which triggers
  // unneccessary builds in watch mode with webpack v5, hence need to write
  // a file before the test runs.
  await clearStats();
  await app.setup();
}, 100000);
afterAll(() => app.teardown());

test('`fusion dev` calls onBuildEnd', async () => {
  function statsReady() {
    return tryTimes(async () => {
      const stats = await readStats();

      return stats.length >= 2;
    }, 5);
  }

  // build should be done now
  t.ok(await statsReady());

  let statsOutput = JSON.parse(await readFile(statsFile, 'utf-8'));
  t.ok(Array.isArray(statsOutput));
  statsOutput = statsOutput.map(stat => {
    // initial build
    expect(stat.isIncrementalBuild).toBe(false);
    stat.path = 'path';
    stat.buildTime = 'buildTime';
    stat.buildToolVersion = 'buildToolVersion';
    return stat;
  });
  expect(statsOutput).toMatchInlineSnapshot(`
    Array [
      Object {
        "buildTime": "buildTime",
        "buildToolVersion": "buildToolVersion",
        "command": "dev",
        "isBuildCacheEnabled": true,
        "isBuildCachePersistent": false,
        "isIncrementalBuild": false,
        "minify": true,
        "mode": "development",
        "path": "path",
        "skipSourceMaps": false,
        "target": "client-modern",
        "version": "0.0.0-monorepo",
        "watch": true,
      },
      Object {
        "buildTime": "buildTime",
        "buildToolVersion": "buildToolVersion",
        "command": "dev",
        "isBuildCacheEnabled": true,
        "isBuildCachePersistent": false,
        "isIncrementalBuild": false,
        "minify": true,
        "mode": "development",
        "path": "path",
        "skipSourceMaps": false,
        "target": "server",
        "version": "0.0.0-monorepo",
        "watch": true,
      },
    ]
  `);

  // Clear previous build stats
  await clearStats();

  // Make change for incremental build
  const mainContent = await readFile(path.resolve(dir, 'src/main.js'), 'utf-8');
  const updatedContent = mainContent.replace(
    'class-name',
    'updated-class-name'
  );
  await writeFile(path.resolve(dir, 'src/main.js'), updatedContent);

  t.ok(await statsReady());

  let incStatsOutput = JSON.parse(await readFile(statsFile, 'utf-8'));
  t.ok(Array.isArray(incStatsOutput));
  incStatsOutput = incStatsOutput.map(stat => {
    // subsequent build is incremental
    expect(stat.isIncrementalBuild).toBe(true);
    stat.path = 'path';
    stat.buildTime = 'buildTime';
    stat.buildToolVersion = 'buildToolVersion';
    return stat;
  });
  expect(incStatsOutput).toMatchInlineSnapshot(`
    Array [
      Object {
        "buildTime": "buildTime",
        "buildToolVersion": "buildToolVersion",
        "command": "dev",
        "isBuildCacheEnabled": true,
        "isBuildCachePersistent": false,
        "isIncrementalBuild": true,
        "minify": true,
        "mode": "development",
        "path": "path",
        "skipSourceMaps": false,
        "target": "client-modern",
        "version": "0.0.0-monorepo",
        "watch": true,
      },
      Object {
        "buildTime": "buildTime",
        "buildToolVersion": "buildToolVersion",
        "command": "dev",
        "isBuildCacheEnabled": true,
        "isBuildCachePersistent": false,
        "isIncrementalBuild": true,
        "minify": true,
        "mode": "development",
        "path": "path",
        "skipSourceMaps": false,
        "target": "server",
        "version": "0.0.0-monorepo",
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
