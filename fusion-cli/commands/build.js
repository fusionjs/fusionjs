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
  const logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  });
  logger.add(new winston.transports.Console({level: logLevel}));

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
