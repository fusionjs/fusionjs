// @flow
const {platform} = require('os');
const {exists, exec} = require('./node-helpers');

run();

async function run() {
  const version = process.argv[2];
  const file = {
    darwin: 'bazelisk-darwin-amd64',
    linux: 'bazelisk-linux-amd64',
    win32: 'bazelisk-windows-amd64.exe',
  }[platform()];

  if (!(await exists(`${__dirname}/../bin/bazelisk`))) {
    await exec(
      `curl -L -o ${__dirname}/../bin/bazelisk https://github.com/bazelbuild/bazelisk/releases/download/v${version}/${file} && chmod +x ${__dirname}/../bin/bazelisk`
    );
  }
}
