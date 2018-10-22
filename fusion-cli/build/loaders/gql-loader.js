/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

module.exports = function gqlLoader(content /*: string */) {
  // NOTE: For now, we are simply loading queries and schemas as strings.
  // However, we may wish to load a pre-parsed graphql AST, similar to how https://github.com/samsarahq/graphql-loader works.
  const result = `
  const gql = require('graphql-tag');
  module.exports = gql(${JSON.stringify(content.toString())});
  `;
  return result;
};

module.exports.raw = true;
