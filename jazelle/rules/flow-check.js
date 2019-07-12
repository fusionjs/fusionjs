// @flow
const {
  readFileSync: read,
  existsSync: exists,
  writeFileSync: write,
  realpathSync: realpath,
} = require('fs');
const {execSync: exec} = require('child_process');
const {dirname} = require('path');

const root = process.cwd();
const [node, , main, bin] = process.argv;

const files = exec(`find . -name output.tgz`, {cwd: bin, encoding: 'utf8'})
  .split('\n')
  .filter(Boolean);
files.map(f => {
  const target = `${root}/${dirname(f)}`;
  exec(`tar xzf "${f}" -C "${target}"`, {cwd: bin});
});

// we need flowconfig [include] section to list the realpath of the source code in order for flow to work correctly in bazel
// we use -flowconfig-name to specify a custom config instead of overwriting .flowconfig so that the runfiles reflect src
const configFile = `${main}/.flowconfig`;
if (exists(configFile)) {
  const flowconfig = read(configFile, 'utf8');
  const lines = flowconfig.split('\n');
  const possibleHeaderIndex = lines.indexOf('[include]');
  const headerIndex =
    possibleHeaderIndex > -1 ? possibleHeaderIndex : lines.push('[include]');
  lines.splice(headerIndex + 1, 0, dirname(realpath(`${main}/yarn.lock`)));
  write(`${main}/.customflowconfig`, lines.join('\n'), 'utf8');
  exec(
    `${node} ${main}/node_modules/.bin/flow check --flowconfig-name .customflowconfig`,
    {cwd: main, env: process.env, stdio: 'inherit'}
  );
}
