// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const request = require('axios');
const puppeteer = require('puppeteer');
const {cmd, start, dev} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

const env = Object.create(process.env);

async function buildAndStartProductionServer() {
  env.NODE_ENV = 'production';

  await cmd(`build --dir=${dir} --production`, {env});
  const {proc, port} = await start(`--dir=${dir} --useModuleScripts`, {env});
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  return {proc, port, browser};
}

async function checkIfFilesExistForUrls({urlList, listName}) {
  try {
    await Promise.all(
      urlList.map((url) =>
        request(url)
          .then(({status, data}) => {
            if (status !== 200 || !data || !data.length) {
              throw new Error();
            }
          })
          .catch(() => {
            throw new Error(`${url} does not exist`);
          })
      )
    );
  } catch (err) {
    // $FlowIgnore - t.fail(a: string) is not available in flow libdefs
    t.fail(`${err.message} from ${listName}`);
  }
}

describe('UseModuleScripts tests', () => {
  test('`fusion start` --useModuleScripts should generate HTML with script tags having type=module for modern bundles and nomodule for legacy bundles with only modern bundles preloading', async () => {
    try {
      const {proc, port, browser} = await buildAndStartProductionServer();
      const page = await browser.newPage();
      page.setJavaScriptEnabled(false);
      const url = `http://localhost:${port}`;
      await page.goto(`${url}/`);

      const preloadTagsUrls = await page.$$eval('link[rel="preload"]', (els) =>
        els.map((el) => el.getAttribute('href'))
      );
      const scriptTagsUrlsWithTypeModule = await page.$$eval(
        'script[src][type="module"]',
        (els) => els.map((el) => el.src)
      );
      const scriptTagsUrlsWithNoModule = await page.$$eval(
        'script[src][nomodule]',
        (els) => els.map((el) => el.src)
      );

      t.ok(
        preloadTagsUrls.every((url) => !url.includes('client-legacy')),
        'The urls in preload tags should be of modern bundle'
      );

      t.ok(
        scriptTagsUrlsWithTypeModule.every(
          (url) => !url.includes('client-legacy')
        ),
        'The urls in script type="module" tags should be of modern bundle'
      );

      t.ok(
        scriptTagsUrlsWithNoModule.every((url) =>
          url.includes('client-legacy')
        ),
        'The urls in script nomodule tags should be of legacy bundle'
      );

      await checkIfFilesExistForUrls({
        urlList: scriptTagsUrlsWithTypeModule,
        listName: 'scriptTagsUrlsWithTypeModule',
      });

      await checkIfFilesExistForUrls({
        urlList: scriptTagsUrlsWithNoModule,
        listName: 'scriptTagsUrlsWithNoModule',
      });

      await browser.close();
      proc.kill('SIGKILL');
    } catch (e) {
      t.ifError(e);
    }
  }, 25000);

  test('`fusion dev` --useModuleScripts should generate HTML with script tags having type=module for modern bundles and nomodule for legacy bundles with only modern bundles preloading with forceLegacyBuild', async () => {
    try {
      const {proc, port} = await dev(
        `--dir=${dir} --useModuleScripts --forceLegacyBuild`
      );
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      const url = `http://localhost:${port}`;
      page.setJavaScriptEnabled(false);
      await page.goto(`${url}/`);

      const preloadTagsUrls = await page.$$eval('link[rel="preload"]', (els) =>
        els.map((el) => el.getAttribute('href'))
      );
      const scriptTagsUrlsWithTypeModule = await page.$$eval(
        'script[src][type="module"]',
        (els) => els.map((el) => el.src)
      );
      const scriptTagsUrlsWithNoModule = await page.$$eval(
        'script[src][nomodule]',
        (els) => els.map((el) => el.src)
      );

      t.ok(
        preloadTagsUrls.every((url) => !url.includes('client-legacy')),
        'The urls in preload tags should be of modern bundle'
      );

      t.ok(
        scriptTagsUrlsWithTypeModule.every(
          (url) => !url.includes('client-legacy')
        ),
        'The urls in script type="module" tags should be of modern bundle'
      );

      t.ok(
        scriptTagsUrlsWithNoModule.every((url) =>
          url.includes('client-legacy')
        ),
        'The urls in script nomodule tags should be of legacy bundle'
      );

      await checkIfFilesExistForUrls({
        urlList: scriptTagsUrlsWithTypeModule,
        listName: 'scriptTagsUrlsWithTypeModule',
      });

      await checkIfFilesExistForUrls({
        urlList: scriptTagsUrlsWithNoModule,
        listName: 'scriptTagsUrlsWithNoModule',
      });

      await browser.close();
      proc.kill('SIGKILL');
    } catch (e) {
      t.ifError(e);
    }
  }, 25000);

  test('`fusion dev` --useModuleScripts should generate HTML with script tags having type=module with only modern bundles preloading without forceLegacyBuild', async () => {
    try {
      const {proc, port} = await dev(`--dir=${dir} --useModuleScripts`);
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      const url = `http://localhost:${port}`;
      page.setJavaScriptEnabled(false);
      await page.goto(`${url}/`);

      const preloadTagsUrls = await page.$$eval('link[rel="preload"]', (els) =>
        els.map((el) => el.getAttribute('href'))
      );
      const scriptTagsUrlsWithTypeModule = await page.$$eval(
        'script[src][type="module"]',
        (els) => els.map((el) => el.src)
      );
      const scriptTagsUrlsWithNoModule = await page.$$eval(
        'script[src][nomodule]',
        (els) => els.map((el) => el.src)
      );

      t.ok(
        preloadTagsUrls.every((url) => !url.includes('client-legacy')),
        'The urls in preload tags should be of modern bundle'
      );

      t.ok(
        scriptTagsUrlsWithTypeModule.every(
          (url) => !url.includes('client-legacy')
        ),
        'The urls in script type="module" tags should be of modern bundle'
      );

      t.equal(
        scriptTagsUrlsWithNoModule.length,
        0,
        'There should be no script tags with nomodule as legacy bundles are not added in SSR for dev'
      );

      await checkIfFilesExistForUrls({
        urlList: scriptTagsUrlsWithTypeModule,
        listName: 'scriptTagsUrlsWithTypeModule',
      });

      await browser.close();
      proc.kill('SIGKILL');
    } catch (e) {
      t.ifError(e);
    }
  }, 25000);
});
