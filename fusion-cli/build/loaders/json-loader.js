/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const JsonParser = require('webpack/lib/JsonParser.js');
const JsonGenerator = require('webpack/lib/JsonGenerator.js');

module.exports = function jsonLoader(content /*: string*/) {
  if (!this.request.includes('assetUrl=true')) {
    this._module.type = 'json';
    this._module.parser = new JsonParser();
    this._module.generator = new JsonGenerator();
  }
  return content;
};
