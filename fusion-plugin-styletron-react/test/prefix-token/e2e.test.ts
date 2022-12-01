/**
 * @jest-environment node
 * @ts-nocheck
 */

/* eslint-env jest, node, browser */

const child_process = require("child_process");
const { promisify } = require("util");
const getPort = require("get-port");
const puppeteer = require("puppeteer");
const { untilReady, getComputedStyle, getStyles } = require("../utils");

const execFile = promisify(child_process.execFile);
const spawn = child_process.spawn;

const fixture = __dirname;

test("token prefix", async () => {
  const [port] = await Promise.all([
    getPort(),
    execFile("fusion", ["build"], { cwd: fixture }),
  ]);

  const server = spawn("fusion", ["start", `--port=${port}`], {
    stdio: "inherit",
    cwd: fixture,
  });

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await untilReady(page, port);

  expect((await getComputedStyle(page, "#styled")).color).toEqual(
    "rgb(255, 0, 0)"
  );
  const styles = await getStyles(page);

  expect(styles.every((style) => style.startsWith(".__atomic_prefix__"))).toBe(
    true
  );

  server.kill();
  browser.close();
}, 100000);
