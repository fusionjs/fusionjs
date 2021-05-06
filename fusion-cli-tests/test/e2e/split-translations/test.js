// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const dev = require('../setup.js');

const {cmd, start} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

test('`fusion build` app with split translations integration', async () => {
  var env = Object.create(process.env);
  env.NODE_ENV = 'production';

  await cmd(`build --dir=${dir} --production`, {env});

  const {proc, port} = await start(`--dir=${dir}`, {env, cwd: dir});
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`, {waitUntil: 'load'});
  const content = await page.content();
  t.ok(
    content.includes('__MAIN_TRANSLATED__'),
    'app content contains translated main chunk'
  );
  t.ok(
    content.includes('__HOC_TRANSLATED__'),
    'app content contains translated hoc chunk'
  );
  t.ok(
    content.includes('__HOOK_TRANSLATED__'),
    'app content contains translated static hook chunk'
  );
  t.ok(
    content.includes('__ABC_TRANSLATED__'),
    'app content contains translated dynamic hook chunk'
  );
  t.ok(
    !content.includes('__SPLIT1_TRANSLATED__'),
    'split translation not inlined'
  );
  t.ok(
    !content.includes('__SPLIT2_TRANSLATED__'),
    'split translation not inlined'
  );
  t.ok(
    !content.includes('__UNUSED_TRANSLATED__'),
    'unused translation not inlined'
  );

  await Promise.all([
    page.click('#split1-link'),
    page.waitForSelector('#split1-translation'),
  ]);

  const content2 = await page.content();
  t.ok(
    content2.includes('__SPLIT1_TRANSLATED__'),
    'renders first split translation'
  );
  t.ok(
    content2.includes('__OTHER_COMPONENT__'),
    'renders first split child translations'
  );
  t.ok(
    content2.includes('other-component-missing-key'),
    'renders first split child missing translations'
  );

  await Promise.all([
    page.click('#split2-link'),
    page.waitForSelector('#split2-translation'),
  ]);
  const content3 = await page.content();
  t.ok(
    content3.includes('__SPLIT2_TRANSLATED__'),
    'renders second split translation'
  );
  browser.close();
  proc.kill('SIGKILL');
}, 100000);

test('`fusion dev` app with split translations integration', async () => {
  const app = dev(dir);
  await app.setup();

  const split2Path = path.join(dir, 'src/split2.js');
  const original = fs.readFileSync(split2Path, 'utf8');

  t.ok(original.includes('<Translate id="split2" />'), 'has original src');
  const replaced = original.replace(
    '<Translate id="split2" />',
    '<Translate id="hot" />'
  );

  const url = await app.url();
  const page = await app.browser().newPage();
  await page.goto(`${url}/`, {waitUntil: 'load'});
  const content = await page.content();
  t.ok(
    content.includes('__MAIN_TRANSLATED__'),
    'app content contains translated main chunk'
  );
  t.ok(
    !content.includes('__SPLIT1_TRANSLATED__'),
    'split translation not inlined'
  );
  t.ok(
    !content.includes('__SPLIT2_TRANSLATED__'),
    'split translation not inlined'
  );
  t.ok(
    !content.includes('__UNUSED_TRANSLATED__'),
    'unused translation not inlined'
  );

  await Promise.all([
    page.click('#split1-link'),
    page.waitForSelector('#split1-translation'),
  ]);
  const content2 = await page.content();
  t.ok(
    content2.includes('__SPLIT1_TRANSLATED__'),
    'renders first split translation'
  );
  t.ok(
    content2.includes('__OTHER_COMPONENT__'),
    'renders first split child translations'
  );
  t.ok(
    content2.includes('other-component-missing-key'),
    'renders first split child missing translations'
  );

  const reloaded = page.evaluate(() => {
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

  fs.writeFileSync(split2Path, replaced);

  await reloaded;

  await Promise.all([
    page.click('#split2-link'),
    page.waitForSelector('#split2-translation'),
  ]);
  const content3 = await page.content();
  t.ok(
    content3.includes('__HOT_TRANSLATED__'),
    'renders second, hot split translation'
  );

  // go back to first route
  await Promise.all([
    page.click('#split1-link'),
    page.waitForSelector('#split1-translation'),
  ]);

  fs.writeFileSync(split2Path, original);

  // go to second route again
  // make sure promise-intrumented translations are updated
  await Promise.all([
    page.click('#split2-link'),
    page.waitForSelector('#split2-translation'),
    new Promise(r => setTimeout(r, 2000)), // component is initally rendered without translation
  ]);
  const content4 = await page.content();
  t.ok(
    content4.includes('__SPLIT2_TRANSLATED__'),
    'translations are re-fetched when promise instrumentation is hot-reloaded'
  );

  await page.goto(`${url}/`, {waitUntil: 'load'});

  await Promise.all([
    page.click('#split1-link'),
    page.waitForSelector('#split1-translation'),
  ]);
  const content5 = await page.content();
  t.ok(
    content5.includes('__SPLIT1_TRANSLATED__'),
    'renders translation from unmodified file after rebuild'
  );
  t.ok(
    content2.includes('__OTHER_COMPONENT__'),
    'renders first split unmodified child translations after rebuild'
  );
  t.ok(
    content2.includes('other-component-missing-key'),
    'renders first split unmodified child missing translations after rebuild'
  );

  await app.teardown();
}, 100000);

test('`fusion dev` app with split translations integration (cached)', async () => {
  // Startup first time
  const initialApp = dev(dir);
  await initialApp.setup();
  await initialApp.teardown();

  // Restart
  const app = dev(dir);
  await app.setup();

  const page = await app.browser().newPage();
  const url = await app.url();
  await page.goto(`${url}/`, {waitUntil: 'load'});
  const content = await page.content();
  t.ok(
    content.includes('__MAIN_TRANSLATED__'),
    'app content contains translated main chunk'
  );

  await Promise.all([
    page.click('#split1-link'),
    page.waitForSelector('#split1-translation'),
  ]);
  const content2 = await page.content();
  t.ok(
    content2.includes('__SPLIT1_TRANSLATED__'),
    'renders first split translation'
  );
  t.ok(
    content2.includes('__OTHER_COMPONENT__'),
    'renders first split child translations'
  );
  t.ok(
    content2.includes('other-component-missing-key'),
    'renders first split child missing translations'
  );

  app.teardown();
}, 100000);

describe('i18n manifest caching', () => {
  const splitFilePath = path.join(dir, 'src/split1.js');
  const otherComponentFilePath = path.join(dir, 'src/other-component.js');
  const otherComponentRenamedFilePath = otherComponentFilePath.replace(
    'other-component.js',
    'other-component-renamed.js'
  );

  let splitFileContents;
  beforeEach(() => {
    splitFileContents = fs.readFileSync(splitFilePath, 'utf-8');
    fs.copyFileSync(otherComponentFilePath, otherComponentRenamedFilePath);
  });

  afterEach(() => {
    fs.writeFileSync(splitFilePath, splitFileContents);
    fs.unlinkSync(otherComponentRenamedFilePath);
  });

  function changeOtherComponentImportPath() {
    fs.writeFileSync(
      splitFilePath,
      splitFileContents.replace(
        './other-component.js',
        './other-component-renamed.js'
      )
    );
  }

  function verifyBuiltWithoutErrors() {
    const stats = JSON.parse(
      fs.readFileSync(path.join(dir, '.fusion/stats.json'), 'utf-8')
    );

    return !stats.errors || !stats.errors.length;
  }

  test('`fusion dev` should build fine from memory cache after file name change', async () => {
    const app = dev(dir);
    await app.setup();
    t.ok(verifyBuiltWithoutErrors(), 'built without errors');

    const page = await app.browser().newPage();
    const url = await app.url();
    await page.goto(`${url}/split1`, {waitUntil: 'load'});

    const content = await page.content();
    t.ok(
      content.includes('__SPLIT1_TRANSLATED__'),
      'renders first split translation initially'
    );
    t.ok(
      content.includes('__OTHER_COMPONENT__'),
      'renders first split child translations initially'
    );
    t.ok(
      content.includes('other-component-missing-key'),
      'renders first split child missing translations initially'
    );

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

    changeOtherComponentImportPath();
    await hmrCompleted;

    t.ok(verifyBuiltWithoutErrors(), 're-built without errors after change');

    const contentAfterChange = await page.content();
    t.ok(
      contentAfterChange.includes('__SPLIT1_TRANSLATED__'),
      'renders first split translation after change'
    );
    t.ok(
      contentAfterChange.includes('__OTHER_COMPONENT__'),
      'renders first split child translations after change'
    );
    t.ok(
      contentAfterChange.includes('other-component-missing-key'),
      'renders first split child missing translations after change'
    );

    app.teardown();
  }, 35000);

  test('`fusion build` should build fine from cache after file name change', async () => {
    async function buildAndStartServer() {
      const env = {
        ...process.env,
        NODE_ENV: 'production',
      };

      await cmd(`build --dir=${dir} --production`, {env});
      const {proc, port} = await start(`--dir=${dir}`, {env, cwd: dir});

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
    t.ok(verifyBuiltWithoutErrors(), 'built without errors');
    await page.goto(`${app.url}/split1`, {waitUntil: 'load'});

    const content = await page.content();
    t.ok(
      content.includes('__SPLIT1_TRANSLATED__'),
      'renders first split translation initially'
    );
    t.ok(
      content.includes('__OTHER_COMPONENT__'),
      'renders first split child translations initially'
    );
    t.ok(
      content.includes('other-component-missing-key'),
      'renders first split child missing translations initially'
    );

    app.stop();

    changeOtherComponentImportPath();

    app = await buildAndStartServer();
    t.ok(verifyBuiltWithoutErrors(), 're-built without errors after change');
    await page.goto(`${app.url}/split1`, {waitUntil: 'load'});

    const contentAfterChange = await page.content();
    t.ok(
      contentAfterChange.includes('__SPLIT1_TRANSLATED__'),
      'renders first split translation after change'
    );
    t.ok(
      contentAfterChange.includes('__OTHER_COMPONENT__'),
      'renders first split child translations after change'
    );
    t.ok(
      contentAfterChange.includes('other-component-missing-key'),
      'renders first split child missing translations after change'
    );

    app.stop();
    browser.close();
  }, 35000);
});
