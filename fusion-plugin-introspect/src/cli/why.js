// @flow
const {parseRuntimeMetadata} = require('./parseRuntimeMetadata.js');
const {listDependencies} = require('./listDependencies.js');
const {listSourceLines} = require('./listSourceLines.js');

module.exports.why = async (token /*: string*/) => {
  const data = await parseRuntimeMetadata();
  const deps = listDependencies(data.server);
  const dep = deps.find(dep => dep.name === token);

  if (!dep) return '';

  const explanation = [
    describeType(dep, token),
    describeUsage(dep, token),
    `${token} is used by:\n` + graphParents(deps, token),
    `${token} depends on:\n` + graphChildren(deps, token),
  ];
  return explanation.filter(Boolean).join('\n');
};

function describeType(dep, token) {
  const isPlugin = listSourceLines(dep, 'plugin').length > 0;
  if (isPlugin) {
    const types = {
      service: 'plugin w/ a `provides` method',
      middleware: 'plugin w/ a `middleware` method',
      both: 'plugin w/ a `provides` and `middleware` methods',
      value: 'value',
      noop: 'plugin without methods',
    };
    //eslint-disable-next-line
    return `${token} token is registered with a ${types[dep.type]}\n`;
  }
  return '';
}

function describeUsage(dep, token) {
  const verbs = {
    token: ' is declared in',
    register: ' is registered in',
    plugin: `'s plugin is created in`,
    'alias-from': ' is aliased to another token in', // alias-from is being aliased to alias-to
    'alias-to': ' is aliased from another token in',
  };
  return Object.keys(verbs)
    .map(type => {
      const lines = listSourceLines(dep, type);
      if (lines.length > 0) {
        //eslint-disable-next-line
        return `${token}${verbs[type]}:\n  ${lines.join('\n ')}\n`;
      }
    })
    .filter(Boolean)
    .join('\n');
}

function graphParents(deps, token, fork = true, level = 0) {
  const indent = `${fork ? '│' : ' '}  `.repeat(level);
  const parents = deps
    .filter(dep => dep.dependencies.find(name => name === token))
    .map(({name}, i, {length}) => {
      const fork = i < length - 1;
      const line = fork ? '├─' : '└─';
      const parents = graphParents(deps, name, fork, level + 1);
      return `${indent}${line} ${name}\n${parents}`;
    })
    .join('\n');
  return parents;
}

function graphChildren(deps, token, fork = true, level = 0) {
  const indent = `${fork ? '│' : ' '}  `.repeat(level);
  const self = deps.find(dep => dep.name === token);
  if (!self) return '';
  const children = self.dependencies
    .map((dep, i, {length}) => {
      const fork = i < length - 1;
      const line = fork ? '├─' : '└─';
      const children = graphChildren(deps, dep, fork, level + 1);
      return `${indent}${line} ${dep}\n${children}`;
    })
    .join('');
  return children;
}
