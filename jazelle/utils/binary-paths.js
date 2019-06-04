const bazel = `${__dirname}/../bin/bazelisk`;
const node = process.argv[0];
const yarn = process.env.YARN; // this env var is created by rules/jazelle.bzl

module.exports = {bazel, node, yarn};