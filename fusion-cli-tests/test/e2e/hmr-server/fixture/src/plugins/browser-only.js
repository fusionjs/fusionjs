// @noflow
import { createPlugin, html } from 'fusion-core';

const BrowserOnlyPlugin = createPlugin({
  provides() {
    window.__TEST_BROWSER_ONLY_VALUE__ = 'browser-only-value-default';
  }
});

export default BrowserOnlyPlugin;
