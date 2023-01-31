// @noflow
/* eslint-env node */

const puppeteer = require('puppeteer');

const {dev} = require('./utils.js');

function testSetup(dir /*: string */, ...rest /*: any */) {
  let proc;
  let devPromise;
  let browser;
  let url;

  return {
    setup: async () => {
      let [devResult, browserResult] = await Promise.all([
        dev(`--dir=${dir}`, ...rest),
        puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }),
      ]);
      proc = devResult.proc;
      devPromise = devResult.promise;
      browser = browserResult;
      url = `http://localhost:${devResult.port}`;
      return {proc, browser, url};
    },
    browser: () => browser,
    url: () => url,
    teardown: async (isGracefulShutdown) => {
      if (isGracefulShutdown) {
        try {
          proc.kill();
          await devPromise;
        } catch (e) {
          proc.kill('SIGKILL');
        }
      } else {
        proc.kill('SIGKILL');
      }

      browser.close();
    },
  };
}

module.exports = testSetup;
