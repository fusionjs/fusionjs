import puppeteer from "puppeteer";

import { startServer, logCachedURLs } from "./utils.node";

// from fixture-apps/app
const cacheablePaths = [
  "/_static/client-main.js",
  "/_static/client-runtime.js",
  "/_static/client-vendor.js",
];

test("/response to redirect", async () => {
  expect.assertions(7);
  const hostname = "http://localhost:";
  const { port, proc } = await startServer();
  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--enable-features=NetworkService",
    ],
    ignoreHTTPSErrors: true,
  });
  try {
    let isReady;
    const page = await browser.newPage();
    page.on("console", (msg) => {
      if (msg._text.startsWith("[TEST] cached after redirect:")) {
        const cacheKeys = msg._text.split("#")[1].split(",");
        expect(
          // add one for HTML
          cacheKeys.length === cacheablePaths.length + 1
        ).toBeTruthy();
        expect(
          cacheablePaths.every((path) =>
            cacheKeys.includes(`${hostname}${port}${path}`)
          )
        ).toBeTruthy();
        expect(
          cacheKeys.includes(`${hostname}${port}/redirected`) &&
            !cacheKeys.includes(`${hostname}${port}/redirect`)
        ).toBeTruthy();
      }
    });

    // 1. FIRST LOAD
    await page.goto(`${hostname}${port}`);

    isReady = await page.evaluate("navigator.serviceWorker.ready");
    expect(isReady).toBeTruthy();

    await page.waitFor(1000);

    const controller = await page.evaluate(
      "navigator.serviceWorker.controller"
    );
    expect(controller).toBeTruthy();

    // Capture requests during next load.
    const allRequests = new Map();

    page.on("request", (req) => {
      allRequests.set(req.url(), req);
    });

    // 2. TRIGGER REDIRECT
    await page.goto(`${hostname}${port}/redirect`);

    await page.evaluate("navigator.serviceWorker.controller");
    await logCachedURLs(page, "[TEST] cached after redirect:");

    expect(
      Array.from(allRequests.values())
        .filter((req) =>
          cacheablePaths.find(
            (path) =>
              `${hostname}${port}${path}` === req.url() ||
              req.url() === `${hostname}${port}/redirected` // html
          )
        )
        .every((req) => req.response() && req.response().fromServiceWorker())
    ).toBeTruthy();

    expect(
      Array.from(allRequests.values())
        .filter(
          (req) =>
            !cacheablePaths.find(
              (path) => `${hostname}${port}${path}` === req.url()
            )
        )
        .every(
          (req) =>
            req.resourceType() === "document" || // documents always handled by service worker
            !req.response() ||
            !req.response().fromServiceWorker()
        )
    ).toBeTruthy();

    await browser.close();
  } finally {
    proc.kill();
  }
}, 15000);
