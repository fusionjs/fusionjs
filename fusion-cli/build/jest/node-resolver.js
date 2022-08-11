// @noflow

/* eslint-env node */

const createResolver = require('./create-resolver.js');

module.exports = createResolver({
  browser: false,
});
