/**
 * @jest-environment node
 */

/* eslint-env jest, node, browser */

import child_process from 'child_process';
import {promisify} from 'util';
import getPort from 'get-port';
import puppeteer from 'puppeteer';

import {untilReady, getComputedStyle, getStyles} from '../utils';

const execFile = promisify(child_process.execFile);
const spawn = child_process.spawn;

const fixture = __dirname;

test('basic rendering and hydration works', async () => {
  const [port] = await Promise.all([
    getPort(),
    execFile('fusion', ['build'], {cwd: fixture}),
  ]);

  const server = spawn('fusion', ['start', `--port=${port}`], {
    stdio: 'inherit',
    cwd: fixture,
  });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await untilReady(page, port);
  await page.goto(`http://localhost:${port}`);

  expect((await getComputedStyle(page, '#styled')).color).toEqual(
    'rgb(255, 0, 0)'
  );
  expect((await getStyles(page)).length).toBe(1);

  await page.click('#toggle');
  expect((await getComputedStyle(page, '#styled')).color).toEqual(
    'rgb(0, 0, 255)'
  );
  expect((await getStyles(page)).length).toBe(2);

  await page.click('#toggle');
  expect((await getComputedStyle(page, '#styled')).color).toEqual(
    'rgb(255, 0, 0)'
  );
  expect((await getStyles(page)).length).toBe(2);

  server.kill();
  browser.close();
}, 100000);
