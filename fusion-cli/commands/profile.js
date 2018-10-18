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

exports.run = async function profileHandler(
  {dir = '.', port, environment} /*: any */
) {
  const compiler = new Compiler({env: environment, dir, watch: true});
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
