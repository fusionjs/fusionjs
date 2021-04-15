/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const {translationsManifestContextKey} = require('./loader-context.js');

module.exports = function i18nManifestLoader() {
  this.cacheable(false);
  const callback = this.async();

  const i18nManifest = this[translationsManifestContextKey];
  if (!i18nManifest) {
    return void callback('no i18n manifest');
  }

  i18nManifest.result.then(manifest => {
    return void callback(null, generateSource(manifest));
  });
};

function generateSource(manifest) {
  let entries = [];

  for (const [file, keys] of manifest) {
    entries.push(
      `[${JSON.stringify(file)}, ${chunkIdsForPath(file)}, ${JSON.stringify(
        Array.from(keys)
      )}]`
    );
  }

  if (entries.length) {
    return `
      var map = require('fusion-plugin-i18n/chunk-translation-map');
      if (module.hot) {
        // invalidate existing translations if hot reloading
        map.translations = new Map();
      }
      [${entries.join(',')}].forEach(args => map.add(...args));
    `;
  }

  return '';
}

function chunkIdsForPath(path) {
  return `require("__SECRET_CHUNK_ID_LOADER__?path=${path}!")`;
}
