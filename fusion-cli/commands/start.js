/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

exports.run = async function({dir = '.', environment, port, debug} /*: any */) {
  if (debug && !process.env.__FUSION_DEBUGGING__) {
    const command = process.argv.shift();
    const args = process.argv;
    args.unshift('--inspect-brk');
    return cp.spawn(command, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        __FUSION_DEBUGGING__: true,
      },
    });
  }

  const getEntry = env => {
    const entryPath = `.fusion/dist/${env}/server/server-main.js`;
    return path.resolve(dir, entryPath);
  };

  const env = environment
    ? fs.existsSync(getEntry(environment)) && environment
    : ['development', 'production'].find(e => fs.existsSync(getEntry(e)));

  if (env) {
    const entry = getEntry(env);
    // $FlowFixMe
    const {start} = require(entry);
    return start({dir, port: port || process.env.PORT_HTTP || 3000}); // handle server bootstrap errors (e.g. port already in use)
  } else {
    throw new Error(`App can't start. JS isn't compiled`); // handle compilation errors
  }
};
