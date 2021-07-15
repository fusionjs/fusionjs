// @flow
const {parseRuntimeMetadata} = require('../shared/parseRuntimeMetadata.js');
const {listDependencies} = require('../shared/listDependencies.js');
const {describeType} = require('../shared/describeType.js');
const {describeUsage} = require('../shared/describeUsage.js');
const {graphParents} = require('../shared/graphParents.js');
const {graphChildren} = require('../shared/graphChildren.js');

module.exports.why = async (token /*: string*/) => {
  const data = await parseRuntimeMetadata();
  const deps = listDependencies(data.server);
  const dep = deps.find((dep) => dep.name === token);

  if (!dep) return '';

  const explanation = [
    describeType(dep, token),
    describeUsage(dep, token),
    `${token} is used by:\n` + graphParents(deps, token),
    `${token} depends on:\n` + graphChildren(deps, token),
  ];
  return explanation.filter(Boolean).join('\n');
};
