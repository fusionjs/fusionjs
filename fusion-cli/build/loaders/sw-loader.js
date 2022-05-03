/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*eslint-env node */
const webpack = require('webpack');
const MemoryFileSystem = require('memory-fs');
const {getStatsErrors} = require('../webpack-stats-utils.js');

/*::
import type {WebpackConfigOpts} from "../get-webpack-config.js";
*/

const SW_IDENTIFIER = 'sw';
const SW_OUTPUT_FILENAME = 'sw.js';

module.exports = swLoader;

function swLoader() {
  if (!this.optsContext) {
    return '// not supported';
  }

  this.cacheable(false);
  const callback = this.async();
  const opts /*: WebpackConfigOpts*/ = this.optsContext;

  const compiler = getCompiler(opts);

  compiler.run((err, stats) => {
    if (err || stats.hasErrors()) {
      const info = stats.toJson({
        all: false,
        errorDetails: true,
        errors: true,
        errorsCount: true,
        errorStack: true,
      });

      return void callback(
        new Error(
          `Service Worker compilation included errors: \n\n${getStatsErrors(
            info
          ).join('\n')}`
        )
      );
    }

    // Let loader know about compilation dependencies so re-builds are triggered appropriately
    for (let fileDep of stats.compilation.fileDependencies) {
      this.addDependency(fileDep);
    }
    for (let contextDep of stats.compilation.contextDependencies) {
      this.addContextDependency(contextDep);
    }
    for (let missingDep of stats.compilation.missingDependencies) {
      this.addDependency(missingDep);
      this.addContextDependency(missingDep);
    }
    const bundle = compiler.outputFileSystem.readFileSync(
      '/' + SW_OUTPUT_FILENAME
    );
    const source = getSWTemplateFnSource(bundle);
    callback(null, source);
  });
}

let instance;

function getCompiler(opts) {
  if (instance) {
    return instance;
  }
  const {getWebpackConfig} = require('../get-webpack-config.js');

  const config = getWebpackConfig({
    ...opts,
    id: 'sw',
  });
  config.output.filename = SW_OUTPUT_FILENAME;
  // $FlowFixMe
  config.output.library = {
    name: SW_IDENTIFIER,
    type: 'self',
    export: 'default',
  };
  config.output.path = '/';
  // $FlowFixMe
  config.entry = './src/sw';
  instance = webpack(config);
  instance.outputFileSystem = new MemoryFileSystem();
  return instance;
}

// Second-order templating function
function getSWTemplateFnSource(swBundle) {
  return `export const swTemplate = (...params) => "${JSON.stringify(
    swBundle.toString()
  ).slice(
    1,
    -1
  )};self['${SW_IDENTIFIER}'](..." + JSON.stringify(params) + ",${Date.now()})"`;
}
