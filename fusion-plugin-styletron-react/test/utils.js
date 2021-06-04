// @noflow

/* eslint-env node, browser */

exports.getStyles = function getStyles(page) {
  return page.evaluate(() => {
    return Array.from(document.styleSheets).flatMap((sheet) =>
      Array.from(sheet.cssRules).flatMap((rule) => rule.cssText)
    );
  });
};

exports.getComputedStyle = function getComputedStyle(page, selector) {
  return page.$eval(selector, (el) =>
    JSON.parse(JSON.stringify(getComputedStyle(el)))
  );
};

exports.untilReady = async function untilReady(page, port) {
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
};
