// @flow
process.on('unhandledRejection', e => {
  console.error(e.stack);
});

require('./index.js').runCLI(process.argv.slice(2));
