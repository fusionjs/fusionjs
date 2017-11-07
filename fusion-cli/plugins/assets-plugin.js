//@flow
/* eslint-env node */
const envVarsPlugin = require('./environment-variables-plugin');

const mount = require('koa-mount');
const serve = require('koa-static');

module.exports = function() {
  const {assetPath, env} = envVarsPlugin().of();
  return mount(assetPath, serve(`.fusion/dist/${env}/client`));
};
