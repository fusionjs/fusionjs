// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const request = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');

const dev = require('../setup.js');
const {start, cmd} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion dev` CHUNK_ID instrumentation', async () => {
  const app = dev(dir);
  await app.setup();
  const url = app.url();
  const {data: resA} = await request(`${url}/test-a`);
  const {data: resB} = await request(`${url}/test-b`);
  const {data: resCombined} = await request(`${url}/test-combined`);
  const {data: resTransitive} = await request(`${url}/test-transitive`);
  expect(resA).toMatchInlineSnapshot(`
    Array [
      "src_test-a_js",
      "src_test-combined_js",
    ]
  `);
  expect(resB).toMatchInlineSnapshot(`
    Array [
      "src_test-b_js",
      "src_test-combined_js",
    ]
  `);
  expect(resCombined).toMatchInlineSnapshot(`
    Array [
      "src_test-combined_js",
    ]
  `);
  expect(resTransitive).toMatchInlineSnapshot(`
    Array [
      "src_test-transitive_js",
    ]
  `);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`${url}/`, {waitUntil: 'load'});
  const csrContent = await page.content();
  t.ok(csrContent.includes('<div id="csr">src_test-transitive_js</div>'));

  browser.close();
  app.teardown();
}, 100000);

test('`fusion build` with dynamic imports and group chunks', async () => {
  await cmd(`build --dir=${dir} --production`);
  const {proc, port} = await start(`--dir=${dir}`, {
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  });
  const {data: resA} = await request(`http://localhost:${port}/test-a`);
  const {data: resB} = await request(`http://localhost:${port}/test-b`);
  const {data: resCombined} = await request(
    `http://localhost:${port}/test-combined`
  );
  const {data: resTransitive} = await request(
    `http://localhost:${port}/test-transitive`
  );
  expect(resA).toMatchInlineSnapshot(`
    Array [
      838,
      967,
      "legacy-649",
      "legacy-809",
    ]
  `);
  expect(resB).toMatchInlineSnapshot(`
    Array [
      439,
      967,
      "legacy-649",
      "legacy-893",
    ]
  `);
  expect(resCombined).toMatchInlineSnapshot(`
    Array [
      967,
      "legacy-649",
    ]
  `);
  expect(resTransitive).toMatchInlineSnapshot(`
    Array [
      638,
      "legacy-542",
    ]
  `);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
  const csrContent = await page.content();
  t.ok(csrContent.includes('<div id="csr">638</div>'));

  browser.close();
  proc.kill('SIGKILL');
}, 100000);

describe('split chunk ids kept in sync on both client and server', () => {
  const testSplitChunkGroupFilePath = path.join(
    dir,
    '/src/test-split-chunk-group.js'
  );

  let testSplitChunkGroupContents;
  beforeEach(() => {
    testSplitChunkGroupContents = fs.readFileSync(
      testSplitChunkGroupFilePath,
      'utf8'
    );
  });

  afterEach(() => {
    fs.writeFileSync(testSplitChunkGroupFilePath, testSplitChunkGroupContents);
  });

  async function fetchChunkIds(page, baseUrl) {
    const {data: server} = await request(`${baseUrl}/test-split-chunk-group`);

    await page.goto(`${baseUrl}/`, {waitUntil: 'load'});
    const client = await page.evaluate(() => {
      // eslint-disable-next-line cup/no-undef
      const csrEl = document.querySelector('#csr-test-split-chunk-group');

      return csrEl && csrEl.innerText ? csrEl.innerText.split(',') : [];
    });

    return {
      server,
      client,
    };
  }

  function changeTestSplitChunkGroup() {
    fs.writeFileSync(
      testSplitChunkGroupFilePath,
      testSplitChunkGroupContents.replace('module-a', 'module-b')
    );
  }

  test('`fusion dev` CHUNK_IDS stay in sync on both server and client after change', async () => {
    const app = dev(dir);
    await app.setup();

    const baseUrl = app.url();
    const browser = app.browser();
    const page = await browser.newPage();

    const chunkIds = await fetchChunkIds(page, baseUrl);

    // There should be 2 chunks in this group (one of which is module-a reused chunk)
    expect(chunkIds.server.length).toEqual(2);
    expect(chunkIds.client).toEqual(chunkIds.server);

    const hmrCompleted = page.evaluate(() => {
      return new Promise(resolve => {
        // eslint-disable-next-line
        window.__addHotStatusHandler(status => {
          if (status === 'idle') {
            setTimeout(() => {
              resolve();
            }, 100);
          }
        });
      });
    });

    changeTestSplitChunkGroup();
    await hmrCompleted;

    const chunkIdsAfter = await fetchChunkIds(page, baseUrl);

    // There should be 1 chunk, as module-b is not included anywhere else
    expect(chunkIdsAfter.server.length).toEqual(1);
    expect(chunkIdsAfter.client).toEqual(chunkIdsAfter.server);

    app.teardown();
  }, 15000);

  test('`fusion build` CHUNK_IDS stay in sync on both server and client after change', async () => {
    async function buildAndStartServer() {
      await cmd(`build --dir=${dir} --modernBuildOnly`);
      const {proc, port} = await start(`--dir=${dir}`, {
        env: {
          ...process.env,
          NODE_ENV: 'production',
        },
      });

      return {
        stop() {
          proc.kill('SIGKILL');
        },
        url: `http://localhost:${port}`,
      };
    }

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    let app = await buildAndStartServer();
    const chunkIds = await fetchChunkIds(page, app.url);

    // There should be 2 chunks in this group (one of which is module-a reused chunk)
    expect(chunkIds.server.length).toEqual(2);
    expect(chunkIds.client).toEqual(chunkIds.server);

    app.stop();

    changeTestSplitChunkGroup();

    app = await buildAndStartServer();
    const chunkIdsAfter = await fetchChunkIds(page, app.url);

    // There should be 1 chunk, as module-b is not included anywhere else
    expect(chunkIdsAfter.server.length).toEqual(1);
    expect(chunkIdsAfter.client).toEqual(chunkIdsAfter.server);

    app.stop();
    browser.close();
  }, 15000);
});
