// @flow
const {realpathSync: realpath, statSync: stat, readFileSync} = require('fs');
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
    copyToSourceFolder(file);
  }
});

function untarIntoSandbox(file) {
  const target = resolve(root, dirname(file));
  const untar = `tar xzf "${file}" -C "${target}"`;
  exec(untar, {cwd: root});
}

function copyToSourceFolder(file) {
  const target = resolve(root, dirname(file));
  const real = dirname(realpath(`${target}/package.json`));
  const files = exec(`tar ztf ${file}`, {encoding: 'utf8'})
    .trim()
    .split('\n')
    .map(line => line.replace(/\/$/, ''));
  for (const file of files) {
    if (stat(`${target}/${file}`).isDirectory()) {
      exec(
        `mkdir -p ${real}/${file} && cp -Rf ${target}/${file}/. ${real}/${file}/`
      );
    } else {
      // only overwrite file if it's not identical
      if (read(`${target}/${file}`) !== read(`${real}/${file}`)) {
        exec(`cp -rf ${target}/${file} ${real}/${file}`);
      }
    }
  }
}

function read(file) {
  try {
    return readFileSync(file, 'utf8');
  } catch (e) {
    return Symbol('not found'); // must return something that does not equal itself
  }
}
