// @flow
const {platform} = require('os');
const {exists, exec} = require('./node-helpers');

run();

async function run() {
  const bazeliskPath = `${__dirname}/../bin/bazelisk`;

  const version = '0.0.8';
  const file = {
    darwin: 'bazelisk-darwin-amd64',
    linux: 'bazelisk-linux-amd64',
    win32: 'bazelisk-windows-amd64.exe',
  }[platform()];

  if (!(await exists(bazeliskPath))) {
    await exec(
      `curl -L -o ${bazeliskPath} https://github.com/bazelbuild/bazelisk/releases/download/v${version}/${file} && chmod +x ${bazeliskPath}`
    );
  }
}
