/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const fs = require('fs');

const manifest = require('./i18n-manifest.js');
const emitter = require('./i18n-manifest-emitter.js');

class I18nDiscoveryPlugin {
  /*:: cachePath: string; */

  constructor(opts /*: {cachePath: string} */) {
    this.cachePath = opts.cachePath;
    // On initial build, hydrate translations from previous build
    // if valid cache exists
    if (fs.existsSync(this.cachePath)) {
      try {
        let cached = JSON.parse(fs.readFileSync(this.cachePath, 'utf8'));
        hydrate(cached);
      } catch (e) {
        // Do nothing
      }
    }
  }
  apply(compiler /*: any */) {
    compiler.hooks.done.tap('I18nDiscoveryPlugin', () => {
      try {
        fs.writeFileSync(this.cachePath, serialize());
      } catch (e) {
        // Do nothing
      }
      emitter.set(manifest);
    });
    compiler.hooks.invalid.tap('I18nDiscoveryPlugin', filename => {
      try {
        fs.unlinkSync(this.cachePath);
      } catch (e) {
        // Do nothing
      }
      emitter.invalidate();
      manifest.delete(filename);
    });
  }
}

module.exports = I18nDiscoveryPlugin;

function serialize() {
  const json = {};
  for (let [file, translations] of manifest.entries()) {
    json[file] = Array.from(translations);
  }
  return JSON.stringify(json);
}

function hydrate(parsed) {
  Object.keys(parsed).forEach(file => {
    const translations = new Set(parsed[file]);
    manifest.set(file, translations);
  });
}
