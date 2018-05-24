#!/usr/bin/env node

/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

require('./cli-runner')
  .run(process.argv.slice(2).join(' '))
  .catch(e => {
    // eslint-disable-next-line no-console
    console.error(e.message);
    if (e.yargs) e.yargs.showHelp();
    // Rethrow so that there's a non-zero exit code
    throw e;
  });
