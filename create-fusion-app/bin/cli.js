#!/usr/bin/env node
// @flow
/* eslint-env node */
/* eslint-disable no-console */

const path = require('path');
const chalk = require('chalk');
const scaffold = require('fusion-scaffolder');

const projectName = process.argv[2];

if (!projectName) {
  console.log(`${chalk.red('Could not create application.')}

Please specify the project directory:
  ${chalk.cyan('yarn create fusion-app')} ${chalk.green('<project-directory>')}

Example:
  ${chalk.cyan('yarn create fusion-app')} ${chalk.green('my-fusionjs-app')}
`);
  process.exit(1);
}

console.log(`
Creating a new Fusion.js app in: ${chalk.green(
  `${process.cwd()}${path.sep}${projectName}`
)}
`);

scaffold({
  path: './templates/basic',
  cwd: path.join(__dirname, '..'),
  projectPath: path.join(process.cwd(), projectName),
  project: projectName,
  packageJsonFields: {name: projectName},
})
  .then(() => {
    console.log(`
${chalk.green.bold(`Success! You have created a Fusion.js project.`)}

Start your Fusion.js app with:
  ${chalk.cyan(`cd ${projectName} && yarn dev`)}
`);
  })
  .catch(e => {
    console.log('Error starting your application', e);
  });
