const {exists} = require('./node-helpers.js');

module.exports.assertProjectDir = async dir => {
  if (!await exists(`${dir}/package.json`)) {
    throw new Error('Command must be run from a project folder containing a package.json file. `cd` into your project\'s folder,\nor use the `--cwd` option');
  };
}