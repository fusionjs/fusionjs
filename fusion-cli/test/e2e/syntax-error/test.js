// @flow
/* eslint-env node */

const path = require('path');
const testEnvs = require('../errors.js');

const dir = path.resolve(__dirname, './fixture');

testEnvs('syntax error', dir);
