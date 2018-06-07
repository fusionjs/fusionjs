#!/usr/bin/env node

// @flow
/* eslint-env node */
/* eslint-disable no-console */

const path = require('path');
const chalk = require('chalk');
const scaffold = require('fusion-scaffolder');

const projectName = process.argv[2];

if (!projectName) {
  console.log(`${chalk.red('Could not create plugin.')}

Please specify the project directory:
  ${chalk.cyan('yarn create fusion-plugin')} ${chalk.green(
    '<plugin-directory>'
  )}

Example:
  ${chalk.cyan('yarn create fusion-plugin')} ${chalk.green(
    'my-fusionjs-plugin'
  )}
`);
  process.exit(1);
}

console.log(`
Creating a new Fusion.js plugin in: ${chalk.green(
  `${process.cwd()}/${projectName}`
)}
`);

scaffold({
  path: './templates/plugin',
  cwd: path.join(__dirname, '..'),
  projectPath: path.join(process.cwd(), projectName),
  project: projectName,
  packageJsonFields: {
    files: ['dist', 'src'],
  },
})
  .then(() => {
    console.log(`
${chalk.green.bold(`Success! You have created a Fusion.js plugin.`)}

Find your plugin in the following folder:
  ${chalk.cyan(`${projectName}`)}
`);
  })
  .catch(e => {
    console.log('Error creating your plugin', e);
  });
