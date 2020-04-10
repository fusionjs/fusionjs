// @flow
const {realpathSync: realpath} = require('fs');
const {execSync: exec} = require('child_process');
const {dirname, resolve} = require('path');

const root = process.cwd();
const [runtime] = process.argv.slice(2);

const options = {cwd: root, encoding: 'utf8', maxBuffer: 1e9};
const files = exec(`find . -name __jazelle__*.tgz`, options)
  .split('\n')
  .filter(Boolean);

files.map(file => {
  untarIntoSandbox(file);
  if (runtime) {
    untarToSourceFolder(file);
  }
});

function untarIntoSandbox(file) {
  const target = resolve(root, dirname(file));
  const untar = `tar xzf "${file}" -C "${target}"`;
  exec(untar, {cwd: root});
}

function untarToSourceFolder(file) {
  const target = resolve(root, dirname(file));
  const real = dirname(realpath(`${target}/package.json`));
  const untar = `tar xzf "${file}" -C "${real}"`;
  exec(untar, {cwd: root});
}
