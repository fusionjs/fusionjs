/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

// const JsonParser = require('webpack/lib/JsonParser.js');
// const JsonGenerator = require('webpack/lib/JsonGenerator.js');

module.exports = function jsonLoader(content /*: string*/) {
  if (!this.request.includes('assetUrl=true')) {
    // Turn on native json behavior in next major version:
    // this._module.type = 'json';
    // this._module.parser = new JsonParser();
    // this._module.generator = new JsonGenerator();

    let value = typeof content === 'string' ? JSON.parse(content) : content;
    value = JSON.stringify(value)
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
    return `module.exports = ${value}`;
  }
  return content;
};
