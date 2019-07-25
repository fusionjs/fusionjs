// @flow
process.on('unhandledRejection', e => {
  console.error(e.stack);
  process.exit(1);
});

require('./index.js').runCLI(process.argv.slice(2));
