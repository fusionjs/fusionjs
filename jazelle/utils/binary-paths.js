// @flow
const bazel = `${__dirname}/../bin/bazelisk`; // bazelisk gets put here by the preintall hook in package.json
const node = String(process.argv[0]); // coerce to string to make Flow happy
const yarn = String(
  process.env.YARN || `${__dirname}/../bin/yarn.js` // this env var is created by rules/jazelle.bzl, the yarn binary is put there by preinstall hook
);

module.exports = {bazel, node, yarn};
