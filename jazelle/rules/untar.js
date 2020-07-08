// @flow
const {
  realpathSync: realpath,
  statSync: stat,
  readFileSync,
  existsSync: exists,
  mkdirSync: mkdir,
  readdirSync: ls,
  copyFileSync: cp,
} = require('fs');
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
    copy(target, real, file);
  }
}

function copy(target, real, file) {
  if (stat(`${target}/${file}`).isDirectory()) {
    const srcPath = `${real}/${file}`;
    if (!exists(srcPath)) mkdir(srcPath);
    for (const child of ls(srcPath)) {
      copy(target, real, `${file}/${child}`);
    }
  } else {
    // only overwrite file if it's not identical
    if (read(`${target}/${file}`) !== read(`${real}/${file}`)) {
      cp(`${target}/${file}`, `${real}/${file}`);
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
