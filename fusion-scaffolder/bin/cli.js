#!/usr/bin/env node
const colors = require('colors');
const {log} = require('console');
const minimist = require('minimist');
const packageJson = require('../package.json');
const scaffold = require('../');

const options = minimist(process.argv.slice(2), {
  alias: {
    h: 'help',
    v: 'version',
  },
});

// Show version information when --version
if (options.version) {
  return log(packageJson.version);
}

// Show usage information when options incorrectly passed or using --help
if (options._.length !== 2 || options.help) {
  return log(`
    Usage: ${colors.cyan('fusion-scaffold')} ${colors.green(
    '<path-to-template>'
  )} ${colors.green('<project-name>')}

    Options:

      -h, --help          Output the usage information
      -v, --version       Output the version number
  `);
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
  .catch(e => {
    log(colors.red(e));
  });
