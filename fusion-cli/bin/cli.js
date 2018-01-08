#!/usr/bin/env node
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
