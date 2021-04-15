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

  await new Promise(res => setTimeout(res, 5000));
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
    'renders first  split translation'
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

  await page.goto(`${url}/`, {waitUntil: 'load'});

  await Promise.all([
    page.click('#split1-link'),
    page.waitForSelector('#split1-translation'),
  ]);
  const content4 = await page.content();
  t.ok(
    content4.includes('__SPLIT1_TRANSLATED__'),
    'renders translation from unmodified file after rebuild'
  );

  fs.writeFileSync(split2Path, original);

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
    'renders first  split translation'
  );

  app.teardown();
}, 100000);
