/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

require('./cli/dev');
require('./cli/test');
require('./cli/build');
require('./compiler/api');
require('./compiler/errors');
require('./hmr');
require('./route-prefix.js');

/*
require('./browser-support');
*/
require('../build/babel-plugins/babel-plugin-pure-create-plugin/test');
require('../build/babel-plugins/babel-plugin-asseturl/test');
require('../build/babel-plugins/babel-plugin-chunkid/test');
require('../build/babel-plugins/babel-plugin-i18n/test');
require('../build/babel-plugins/babel-plugin-sw/test');
require('../build/babel-plugins/babel-plugin-sync-chunk-ids/test');
require('../build/babel-plugins/babel-plugin-sync-chunk-paths/test');
require('../build/babel-plugins/babel-plugin-utils/test');
require('../build/babel-plugins/babel-plugin-transform-tree-shake/test');

process.on('unhandledRejection', e => {
  throw e;
});
