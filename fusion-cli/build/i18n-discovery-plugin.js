/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const manifest = require('./i18n-manifest.js');
const emitter = require('./i18n-manifest-emitter.js');

class I18nDiscoveryPlugin {
  apply(compiler /*: any */) {
    compiler.hooks.done.tap('I18nDiscoveryPlugin', () => {
      emitter.set(manifest);
    });
    compiler.hooks.invalid.tap('I18nDiscoveryPlugin', filename => {
      emitter.invalidate();
      manifest.delete(filename);
    });
  }
}

module.exports = I18nDiscoveryPlugin;
