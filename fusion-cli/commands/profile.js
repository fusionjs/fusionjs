/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const {Compiler} = require('../build/compiler');
const analyzer = require('bundle-analyzer');

exports.command = 'profile [--dir] [--environment] [--port]';
exports.desc = 'Profile your application';
exports.builder = {
  dir: {
    type: 'string',
    default: '.',
    describe: 'Root path for the application relative to CLI CWD',
  },
  environment: {
    type: 'string',
    default: 'production',
    describe: 'Either `production` or `development`',
  },
  port: {
    type: 'number',
    default: '4000',
    describe: 'Port for the bundle analyzer server',
  },
};
exports.run = async function profileHandler(
  {dir = '.', port, environment} /*: any */
) {
  const compiler = new Compiler({envs: [environment], dir, watch: true});
  const server = analyzer.start({
    dir: `${dir}/.fusion/dist/${environment}/client`,
    port,
  });
  const watcher = compiler.start(() => {
    server.update();
  });
  return {
    compiler,
    stop() {
      watcher.close();
      server.close();
    },
  };
};
