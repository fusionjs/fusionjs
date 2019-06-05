// @flow
const {read, ensure} = require('./node-helpers.js');

const getManifest = async root => {
  const manifest = `${root}/manifest.json`;
  return ensure(async () => {
    const data = await read(manifest, 'utf8');
    return JSON.parse(data || '{}');
  }).catch(
    `${manifest} is not valid JSON. Make sure file exists and syntax is valid`
  );
};

module.exports = {getManifest};
