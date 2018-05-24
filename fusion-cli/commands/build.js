/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const winston = require('winston');

const {Compiler} = require('../build/compiler.js');

exports.command =
  'build [--dir] [--test] [--cover] [--production] [--log-level]';
exports.desc = 'Build your app';
exports.builder = {
  dir: {
    type: 'string',
    default: '.',
    describe: 'Root path for the application relative to CLI CWD',
  },
  test: {
    type: 'boolean',
    default: false,
    describe: 'Build test assets as well as development assets',
  },
  cover: {
    type: 'boolean',
    default: false,
    describe: 'Build tests (with coverage) as well as development assets',
  },
  production: {
    type: 'boolean',
    default: false,
    describe: 'Build production assets',
  },
  'log-level': {
    type: 'string',
    default: 'info',
    describe: 'Log level to show',
  },
};

exports.run = async function(
  {
    dir = '.',
    production,
    test,
    cover,
    logLevel,
  } /*: {
    dir: string,
    production: boolean,
    test: boolean,
    cover: boolean,
    logLevel: string,
  }*/
) {
  const logger = new winston.Logger({
    transports: [
      new winston.transports.Console({colorize: true, level: logLevel}),
    ],
  });

  const envs = [];
  if (production) envs.push('production');
  if (envs.length === 0) envs.push('development');
  if (test) envs.push('test');
  const compiler = new Compiler({envs, dir, cover, logger});

  await compiler.clean();

  await new Promise((resolve, reject) => {
    compiler.start((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err || new Error('Compiler stats included errors.'));
      }
      return resolve();
    });
  });

  return compiler;
};
