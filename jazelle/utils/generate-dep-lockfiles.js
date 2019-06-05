// @flow
const {sync} = require('yarn-utilities');

const generateDepLockfiles = async deps => {
  const dirs = deps.map(dep => dep.dir);
  await sync({roots: dirs, ignore: deps.map(dep => dep.meta.name)});
};

module.exports = {generateDepLockfiles};
