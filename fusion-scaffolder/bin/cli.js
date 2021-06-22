#!/usr/bin/env node
/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const colors = require('colors');
const minimist = require('minimist');
const packageJson = require('../package.json');
const scaffold = require('../');

const {log} = console;

const options = minimist(process.argv.slice(2), {
  alias: {
    h: 'help',
    v: 'version',
  },
});

// Show version information when --version
if (options.version) {
  log(packageJson.version);
  process.exit(0);
}

// Show usage information when options incorrectly passed or using --help
if (options._.length !== 2 || options.help) {
  log(`
    Usage: ${colors.cyan('fusion-scaffold')} ${colors.green(
    '<path-to-template>'
  )} ${colors.green('<project-name>')}

    Options:

      -h, --help          Output the usage information
      -v, --version       Output the version number
  `);
  process.exit(0);
}

// Set named options
options.path = options._[0];
options.project = options._[1];

// Scaffold
log(colors.cyan(`Scaffolding "${options.project}"...`));

scaffold(options)
  .then(() => {
    log(
      `${colors.green('Success!')} Project "${
        options.project
      }" has been scaffolded!`
    );
  })
  .catch((e) => {
    log(colors.red(e));
  });
