// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const dev = require('../setup.js');

const {cmd, start} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

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
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto(`${url}/`, {waitUntil: 'load'});
  const content = await page.content();
  console.log('--------------------------- content -----------------------');
  console.log(content);
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
  console.log('--------------------------- content 2 -----------------------');
  console.log(content2);
  t.ok(
    content2.includes('__SPLIT1_TRANSLATED__'),
    'renders first  split translation'
  );

  const reloaded = page.evaluate(() => {
    return new Promise(resolve => {
      // eslint-disable-next-line
      window.__addHotStatusHandler(status => {
        if (status === 'idle') {
          resolve();
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
  console.log('--------------------------- content 3 -----------------------');
  console.log(content3);
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
  console.log('--------------------------- content 4 -----------------------');
  console.log(content4);
  t.ok(
    content4.includes('__SPLIT1_TRANSLATED__'),
    'renders translation from unmodified file after rebuild'
  );

  fs.writeFileSync(split2Path, original);

  await app.teardown();
}, 100000);
