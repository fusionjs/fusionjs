const {read, write} = require('./node-helpers.js');

const generateBazelignore = async (root, projects) => {
  const bazelignore = await read(`${root}/.bazelignore`, 'utf8').catch(() => '');
  const ignorePaths = [
    ...new Set([
      ...bazelignore.split('\n'),
      ...projects.map(p => `${p}/node_modules`),
    ])
  ].sort().join('\n');
  if (bazelignore !== ignorePaths) await write(`${root}/.bazelignore`, ignorePaths, 'utf8');
}

module.exports = {generateBazelignore};