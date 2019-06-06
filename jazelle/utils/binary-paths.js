// @flow
const bazel = `${__dirname}/../bin/bazelisk`;
const node = String(process.argv[0]); // coerce to string to make Flow happy
const yarn = String(process.env.YARN); // this env var is created by rules/jazelle.bzl

module.exports = {bazel, node, yarn};
