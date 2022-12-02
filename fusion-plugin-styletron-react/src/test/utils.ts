/* eslint-env node, browser */

export function getStyles(page) {
  return page.evaluate(() => {
    return Array.from(document.styleSheets).flatMap((sheet) =>
      Array.from(sheet.cssRules).flatMap((rule) => rule.cssText)
    );
  });
}

export function getComputedStyle(page, selector?) {
  return page.$eval(selector, (el) =>
    JSON.parse(JSON.stringify(getComputedStyle(el)))
  );
}

export async function untilReady(page, port) {
  let started = false;
  let numTries = 0;
  while (!started && numTries < 10) {
    try {
      await page.goto(`http://localhost:${port}`);
      started = true;
    } catch (e) {
      numTries++;
      await new Promise((resolve) => {
        setTimeout(resolve, Math.pow(2, numTries));
      });
    }
  }

  if (!started) {
    throw new Error('Failed to start');
  }
}
