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
    preserveNames,
    logLevel,
    zopfli,
    minify,
    experimentalServerless,
    modernBuildOnly,
  } /*: {
    experimentalServerless: boolean,
    dir: string,
    production: boolean,
    preserveNames: boolean,
    logLevel: string,
    zopfli: boolean,
    minify: boolean,
    modernBuildOnly: boolean,
  }*/
) {
  const logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  });
  logger.add(new winston.transports.Console({level: logLevel}));

  const env = production ? 'production' : 'development';

  const compiler = new Compiler({
    env,
    dir,
    logger,
    preserveNames,
    zopfli,
    minify,
    serverless: experimentalServerless,
    modernBuildOnly,
  });

  await compiler.clean();

  await new Promise((resolve, reject) => {
    compiler.start((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(
          err ||
            new Error(
              `Compiler stats included errors.\n${stats.toJson('verbose')}`
            )
        );
      }
      return resolve();
    });
  });

  return compiler;
};
