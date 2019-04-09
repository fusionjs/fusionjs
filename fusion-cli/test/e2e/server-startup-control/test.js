// @flow
/* eslint-env node */

const t = require('assert');
const path = require('path');
const fs = require('fs');

const dev = require('../setup.js');

const dir = path.resolve(__dirname, './fixture');
const app = dev(dir);

beforeAll(() => app.setup(), 100000);
afterAll(() => app.teardown());

test('`fusion dev` proxy gracefully recovers from cached SSR errors', async () => {
  async function waitForCompileToStart() {
    // Once the Fusion.js application renders SSR error pages in the app
    // we should leverage module.hot.addStatusHandler.
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  const url = app.url();
  const page = await app.browser().newPage();
  await page.goto(`${url}/`, {waitUntil: 'load'});
  let content = await page.content();
  t.ok(content.includes('<div>HOME</div>'), 'app content exists');

  // Introduce error
  const homeFilePath = `${dir}/src/home.js`;
  const homeFileContents = fs.readFileSync(homeFilePath, 'utf8');
  const homeFileContentsWithError = `${homeFileContents}
        HERE_IS_SSR_ERROR();`;
  fs.writeFileSync(homeFilePath, homeFileContentsWithError);

  // Reload page after compile, see redbox
  await waitForCompileToStart();
  await page.reload();
  content = await page.content();
  t.ok(content.includes('HERE_IS_SSR_ERROR is not defined'));

  // Fix error, reload page. Ensure working state.
  fs.writeFileSync(homeFilePath, homeFileContents);
  await waitForCompileToStart();
  await page.reload();
  content = await page.content();
  t.ok(
    !content.includes('HERE_IS_SSR_ERROR is not defined'),
    'Should not see error after fixing broken state'
  );
  t.ok(content.includes('<div>HOME</div>', 'Finds home content'));

  // We should pause compilation here and explicitly restart it, possibly using babel & IPC.
  // For now just make a non breaking change.
  const nonBreakingContent = homeFileContents.replace(
    'HOME',
    'TRIGGER-BABEL-DELAY'
  );
  fs.writeFileSync(homeFilePath, nonBreakingContent);

  // Reload page, ensure we don't get a redbox, and page is loading.
  await waitForCompileToStart();
  await page.reload();
  content = await page.content();
  t.ok(
    !content.includes('HERE_IS_SSR_ERROR'),
    'Should not find error content after reloading'
  );

  // Unpause compilation, ensure page loads.
  await waitForCompileToStart();
  t.ok(
    content.includes('<div>TRIGGER-BABEL-DELAY</div>'),
    'page should contain updated content'
  );

  // Restore files and clean-up
  fs.writeFileSync(homeFilePath, homeFileContents);
}, 100000);
