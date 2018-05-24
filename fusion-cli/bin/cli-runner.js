/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

process.on('unhandledRejection', e => {
  throw e;
});

const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

module.exports.run = (args /*: any*/) => {
  const cmdsDir = path.resolve(__dirname, '../commands');
  const instance = yargs(args)
    .commandDir(cmdsDir)
    .demandCommand(1)
    .version()
    .help();
  const cmdPath = path.resolve(cmdsDir, `${instance.argv._}.js`);
  if (!fs.existsSync(cmdPath)) {
    const error = new Error(`'${instance.argv._}' is an invalid command\n`);
    // TODO(#3) ideally, the string from yargs.showHelp() should be part of the error message above
    // We don't want to call it here either because we want to avoid polluting stdout for tests
    // Unfortunately, yargs doesn't expose an API to get the string,
    // so we have to expose yargs as a property of the error and then call e.yargs.showHelp() manually from cli.js
    // $FlowFixMe
    Object.defineProperty(error, 'yargs', {
      enumerable: false,
      value: instance,
    });
    return Promise.reject(error);
  } else {
    // $FlowFixMe
    return require(cmdPath).run(instance.argv);
  }
};
