// @flow
/* eslint-env node */
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const request = require('axios');
const t = require('assert');
const EventSource = require('eventsource');
const {dev} = require('../utils.js');

const dir = path.resolve(__dirname, './fixture');

const MAIN_FILEPATH = path.join(dir, 'src', 'main.js');
const ROOT_FILEPATH = path.join(dir, 'src', 'root.js');
const BROWSER_ONLY_FILEPATH = path.join(
  dir,
  'src',
  'plugins',
  'browser-only.js'
);
const SERVER_TEST_ENDPOINT_FILEPATH = path.join(
  dir,
  'src',
  'plugins',
  'server-test-endpoint.js'
);

function fetchSsrContent(url) {
  return request.get(url, {
    headers: {
      accept: 'text/html,application/json',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/80.0.3987.0 Safari/537.36',
    },
  });
}

function initBuildWatcher(port) {
  const watching = new EventEmitter();

  const client = new EventSource(`http://localhost:${port}/__webpack_hmr`);
  client.onmessage = function onMessage(msg) {
    try {
      const e = JSON.parse(msg.data);
      if (e.action) {
        watching.emit(e.action);
      }
    } catch (err) {} // eslint-disable-line
  };

  function waitForBuild(eventName = 'building') {
    return new Promise((resolve) => {
      watching.once(eventName, resolve);
    });
  }

  return [client, waitForBuild];
}

function waitForClientHmrCompleted(page) {
  return page.evaluate(() => {
    return new Promise((resolve) => {
      // eslint-disable-next-line
      window.__addHotStatusHandler((status) => {
        if (status === 'idle') {
          setTimeout(() => {
            resolve();
          }, 100);
        }
      });
    });
  });
}

describe('fusion dev - with server HMR', () => {
  let mainInitialFileContents,
    rootInitialFileContents,
    browserOnlyInitialFileContents,
    serverTestEndpointInitialFileContents;
  beforeAll(async () => {
    [
      mainInitialFileContents,
      rootInitialFileContents,
      browserOnlyInitialFileContents,
      serverTestEndpointInitialFileContents,
    ] = await Promise.all([
      fs.readFile(MAIN_FILEPATH, 'utf8'),
      fs.readFile(ROOT_FILEPATH, 'utf8'),
      fs.readFile(BROWSER_ONLY_FILEPATH, 'utf8'),
      fs.readFile(SERVER_TEST_ENDPOINT_FILEPATH, 'utf8'),
    ]);
  });

  let _browser, _buildWatcher, _stopDev;
  async function setup({
    args,
    stdio,
  } /*: {args?: string[], stdio?: string} */ = {}) {
    let {proc, promise, port} = await dev(
      [`--dir=${dir}`, ...(args || [])].join(' '),
      stdio ? {stdio} : void 0
    );
    function stopDev() {
      if (proc) {
        proc.kill('SIGTERM');
        proc = null;
      }

      return promise;
    }
    _stopDev = stopDev;

    let waitForBuild;
    [_buildWatcher, waitForBuild] = initBuildWatcher(port);

    const browser = (_browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }));

    return {
      port,
      browser,
      stopDev,
      waitForBuild,
    };
  }
  async function cleanup() {
    if (_stopDev) {
      await _stopDev();
      _stopDev = null;
    }

    if (_buildWatcher) {
      _buildWatcher.close();
      _buildWatcher = null;
    }

    if (_browser) {
      await _browser.close();
      _browser = null;
    }
  }

  afterEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await Promise.all([
      fs.writeFile(MAIN_FILEPATH, mainInitialFileContents),
      fs.writeFile(ROOT_FILEPATH, rootInitialFileContents),
      fs.writeFile(BROWSER_ONLY_FILEPATH, browserOnlyInitialFileContents),
      fs.writeFile(
        SERVER_TEST_ENDPOINT_FILEPATH,
        serverTestEndpointInitialFileContents
      ),
    ]);
  });

  it('should disable server hmr with --no-serverHmr option', async () => {
    const {browser, port} = await setup({args: ['--no-serverHmr']});

    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`);

    const initialPageContent = await page.content();
    t.ok(
      initialPageContent.includes('content-default'),
      'initial app content should contain content-default'
    );

    await Promise.all([
      fs.writeFile(
        ROOT_FILEPATH,
        rootInitialFileContents.replace('content-default', 'content-updated')
      ),
      waitForClientHmrCompleted(page),
    ]);

    const updatedPageContentClient = await page.content();
    t.ok(
      updatedPageContentClient.includes('content-updated'),
      'updated app content should contain content-updated'
    );

    const {data: serverHmrStatsAfterUpdate} = await fetchSsrContent(
      `http://localhost:${port}/server-hmr-stats`
    );
    t.ok(
      serverHmrStatsAfterUpdate.reloadCounter === 0,
      'server should have skipped hmr'
    );

    const {data: updatedPageContentServer} = await fetchSsrContent(
      `http://localhost:${port}/`
    );
    t.ok(
      updatedPageContentServer.includes('content-updated'),
      'ssr updated app content should contain content-updated'
    );
  }, 15000);

  it('should handle hmr on both client and server', async () => {
    const {browser, port} = await setup();

    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`);

    const initialPageContent = await page.content();
    t.ok(
      initialPageContent.includes('content-default'),
      'initial app content should contain content-default'
    );

    await Promise.all([
      fs.writeFile(
        ROOT_FILEPATH,
        rootInitialFileContents.replace('content-default', 'content-updated')
      ),
      waitForClientHmrCompleted(page),
    ]);

    const updatedPageContentClient = await page.content();
    t.ok(
      updatedPageContentClient.includes('content-updated'),
      'updated app content should contain content-updated'
    );

    const {data: serverHmrStatsAfterUpdate} = await fetchSsrContent(
      `http://localhost:${port}/server-hmr-stats`
    );
    t.ok(
      serverHmrStatsAfterUpdate.reloadCounter === 1,
      'server should have been reloaded once upon hmr'
    );
    t.ok(
      serverHmrStatsAfterUpdate.skippedCleanupCounter === 0,
      'server should not have skipped cleanup during reload'
    );

    const {data: updatedPageContentServer} = await fetchSsrContent(
      `http://localhost:${port}/`
    );
    t.ok(
      updatedPageContentServer.includes('content-updated'),
      'ssr updated app content should contain content-updated'
    );
  }, 15000);

  it('should handle hmr on the server when client bundle stays intact', async () => {
    const {browser, port, waitForBuild} = await setup();

    const {data: initialServerTestEndpointContent} = await fetchSsrContent(
      `http://localhost:${port}/server-test-endpoint`
    );
    t.ok(
      initialServerTestEndpointContent.includes('server-test-endpoint-default'),
      'initial server test endpoint content should contain server-test-endpoint-default'
    );

    await Promise.all([
      fs.writeFile(
        SERVER_TEST_ENDPOINT_FILEPATH,
        serverTestEndpointInitialFileContents.replace(
          'server-test-endpoint-default',
          'server-test-endpoint-updated'
        )
      ),
      waitForBuild(),
    ]);

    const {data: serverHmrStatsAfterUpdate} = await fetchSsrContent(
      `http://localhost:${port}/server-hmr-stats`
    );
    t.ok(
      serverHmrStatsAfterUpdate.reloadCounter === 1,
      'server should have been reloaded once upon hmr'
    );
    t.ok(
      serverHmrStatsAfterUpdate.skippedCleanupCounter === 0,
      'server should not have skipped cleanup during reload'
    );

    const {data: updatedServerTestEndpointContent} = await fetchSsrContent(
      `http://localhost:${port}/server-test-endpoint`
    );
    t.ok(
      updatedServerTestEndpointContent.includes('server-test-endpoint-updated'),
      'updated server test endpoint content should contain server-test-endpoint-updated'
    );

    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`);

    const pageContentAfterServerHmr = await page.content();
    t.ok(
      pageContentAfterServerHmr.includes('content-default'),
      'app content should render content-default'
    );
  }, 15000);

  it('should skip server reload when server bundle stays intact', async () => {
    const {browser, port} = await setup();

    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`);

    const initialBrowserOnlyValue = await page.evaluate(
      // eslint-disable-next-line
      () => window.__TEST_BROWSER_ONLY_VALUE__
    );
    t.ok(
      initialBrowserOnlyValue === 'browser-only-value-default',
      'initial browser only value should equal browser-only-value-default'
    );

    await Promise.all([
      fs.writeFile(
        BROWSER_ONLY_FILEPATH,
        browserOnlyInitialFileContents.replace(
          'browser-only-value-default',
          'browser-only-value-updated'
        )
      ),
      waitForClientHmrCompleted(page),
    ]);

    const browserOnlyValueAfterUpdate = await page.evaluate(
      // eslint-disable-next-line
      () => window.__TEST_BROWSER_ONLY_VALUE__
    );
    t.ok(
      browserOnlyValueAfterUpdate === 'browser-only-value-updated',
      'updated browser only value should equal browser-only-value-updated'
    );

    const {data: serverHmrStatsAfterUpdate} = await fetchSsrContent(
      `http://localhost:${port}/server-hmr-stats`
    );
    t.ok(
      serverHmrStatsAfterUpdate.reloadCounter === 0,
      'server should not have been reloaded on client-only change'
    );
    t.ok(
      serverHmrStatsAfterUpdate.skippedCleanupCounter === 0,
      'server should not have skipped cleanup'
    );
  }, 15000);

  it('should fallback to full server reload when an error occurs during hmr', async () => {
    const {browser, port, stopDev} = await setup({stdio: 'pipe'});

    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`);

    const initialPageContent = await page.content();
    t.ok(
      initialPageContent.includes('content-default'),
      'initial app content should contain content-default'
    );

    await Promise.all([
      fs.writeFile(
        MAIN_FILEPATH,
        mainInitialFileContents.replace(
          'global.__TEST_TRIGGER_HMR_ONLY_ERROR__',
          'true'
        )
      ),
      fs.writeFile(
        ROOT_FILEPATH,
        rootInitialFileContents.replace('content-default', 'content-updated')
      ),
      waitForClientHmrCompleted(page),
    ]);

    const pageContentAfterFailedHmr = await page.content();
    t.ok(
      pageContentAfterFailedHmr.includes('content-updated'),
      'updated app content should contain content-updated'
    );

    const {stdout, stderr} = await stopDev();
    t.ok(
      stdout.includes('HMR Failed. Attempting full server reload...'),
      'should have attempted full server reload after hmr failed'
    );
    t.ok(
      stderr.includes('Error: Failed to initialize during HMR'),
      'should have logged an error thrown during hmr'
    );
  }, 15000);

  it('should recover from script initialization error', async () => {
    await fs.writeFile(
      MAIN_FILEPATH,
      mainInitialFileContents.replace(
        'global.__TEST_TRIGGER_SCRIPT_INIT_ERROR__',
        'true'
      )
    );

    const {browser, port, stopDev, waitForBuild} = await setup({stdio: 'pipe'});

    try {
      await fetchSsrContent(`http://localhost:${port}/`);
      // $FlowFixMe[incompatible-call]
      t.fail('expected server to render an error');
    } catch (err) {
      if (!err.response) {
        throw err;
      }

      t.ok(
        err.response.data.includes('Error: Script initialization error'),
        'expected server response to contain script initialization error'
      );
    }

    await Promise.all([
      fs.writeFile(MAIN_FILEPATH, mainInitialFileContents),
      fs.writeFile(
        ROOT_FILEPATH,
        rootInitialFileContents.replace('content-default', 'content-updated')
      ),
      waitForBuild(),
    ]);

    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`);

    const pageContentAfterRecovery = await page.content();
    t.ok(
      pageContentAfterRecovery.includes('content-updated'),
      'updated app content should contain content-updated'
    );

    const {stdout, stderr} = await stopDev();
    t.ok(
      stdout.includes('Server has crashed, please check logs for an error'),
      'should have reported that child server has crashed'
    );
    t.ok(
      stderr.includes('Error: Script initialization error'),
      'should have logged an error thrown during script initialization'
    );
  }, 15000);

  it('should recover from child instance crashing', async () => {
    const {browser, port, stopDev, waitForBuild} = await setup({stdio: 'pipe'});

    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`);

    const initialPageContent = await page.content();
    t.ok(
      initialPageContent.includes('content-default'),
      'initial app content should contain content-default'
    );

    await Promise.all([
      fs.writeFile(
        MAIN_FILEPATH,
        mainInitialFileContents.replace(
          'global.__TEST_TRIGGER_PROCESS_EXIT__',
          'true'
        )
      ),
      waitForBuild(),
    ]);

    try {
      await fetchSsrContent(`http://localhost:${port}/`);
      // $FlowFixMe[incompatible-call]
      t.fail('expected server to render an error');
    } catch (err) {
      if (!err.response) {
        throw err;
      }

      t.ok(
        err.response.data.includes(
          'Error: Child process has exited unexpectedly, please check logs for an error. Exit code was 1'
        ),
        'expected server response to contain user friendly error'
      );
    }

    await Promise.all([
      fs.writeFile(MAIN_FILEPATH, mainInitialFileContents),
      fs.writeFile(
        ROOT_FILEPATH,
        rootInitialFileContents.replace('content-default', 'content-updated')
      ),
      waitForBuild(),
    ]);

    await page.reload();
    const pageContentAfterRecovery = await page.content();
    t.ok(
      pageContentAfterRecovery.includes('content-updated'),
      'updated app content should contain content-updated'
    );

    const {stdout, stderr} = await stopDev();
    t.ok(
      stdout.includes('HMR Failed. Attempting full server reload...'),
      'should have attempted full server reload after hmr failed'
    );
    t.ok(
      stdout.includes('Server has crashed, please check logs for an error'),
      'should have reported that child server has crashed'
    );
    t.ok(
      stderr.includes(
        'Error: Child process has exited unexpectedly, please check logs for an error. Exit code was 1'
      ),
      'should have logged user friendly error when child server has crashed'
    );
  }, 15000);
});
