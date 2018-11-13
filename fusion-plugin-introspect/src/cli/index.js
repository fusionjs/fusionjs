#!/usr/bin/env node
// @flow
const process = require('process');
const sade = require('sade');

const {logs} = require('./logs.js');
const {tokens} = require('./tokens.js');
const {why} = require('./why.js');
const {where} = require('./where.js');
const {middleware} = require('./middleware.js');

const cli = sade('fusion-run-introspect');

cli
  .command('tokens')
  .describe('List of all DI tokens in order of resolution')
  .action(logs(tokens));

cli
  .command('why <token>')
  .describe('How a DI token is used')
  .action(logs(why));

cli
  .command('where <token>')
  .describe('Where a DI token is registered')
  .action(logs(where));

cli
  .command('middleware')
  .describe('Which tokens are registered w/ middleware and their order')
  .action(logs(middleware));

if (process.argv.length === 2) process.argv.push('--help');
cli.parse(process.argv);

// eslint-disable-next-line
process.on('unhandledRejection', e => console.error(e.stack));
