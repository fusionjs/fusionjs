// @flow
const path = require('path');
const process = require('process');
const {parseRuntimeMetadata} = require('./parseRuntimeMetadata.js');
const {listDependencies} = require('./listDependencies.js');
const {listSourceLines} = require('./listSourceLines.js');

module.exports.where = async (token /*: string*/) => {
  const data = await parseRuntimeMetadata();
  const dep = [
    ...listDependencies(data.server || []),
    ...listDependencies(data.browser || []),
  ].find(dep => dep.name === token);

  if (!dep) return '';

  const sources = listSourceLines(dep, 'register').map(source => {
    return path.resolve(process.cwd(), source);
  });
  return sources.join('\n');
};
