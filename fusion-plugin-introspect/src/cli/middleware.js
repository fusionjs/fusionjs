// @flow
const {parseRuntimeMetadata} = require('./parseRuntimeMetadata.js');
const {getMaxWordWidth} = require('./getMaxWordWidth.js');
const {listDependencies} = require('./listDependencies.js');
const {listSourceLines} = require('./listSourceLines.js');
const {sortDependencies} = require('./sortDependencies.js');

module.exports.middleware = async () => {
  const data = await parseRuntimeMetadata();

  const lists = [
    data.browser ? `Browser:\n${tabulateTokens(data, 'browser')}\n\n` : '',
    data.server ? `Server:\n${tabulateTokens(data, 'server')}\n\n` : '',
  ];
  // eslint-disable-next-line
  return lists.filter(Boolean).join('\n');
};

const tabulateTokens = (data, type) => {
  const space = ' '.repeat(getMaxWordWidth(data[type]) + 2);
  const deps = sortDependencies(listDependencies(data[type]));

  const list = [];
  deps.forEach(dep => {
    const name = dep.name;
    const sources = listSourceLines(dep, 'plugin');
    if (['middleware', 'both'].includes(dep.type)) {
      list.push(`${name}${space.slice(name.length)}${sources[0]}`);
    }
  });
  return list.join('\n');
};
