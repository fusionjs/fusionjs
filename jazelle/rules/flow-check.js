// @flow
const {realpathSync: realpath, existsSync: exists} = require('fs');
const {execSync: exec} = require('child_process');
const {dirname} = require('path');

const root = process.cwd();
const [node, , main, bin, ...args] = process.argv;

if (exists(`${main}/node_modules/.bin/flow`)) {
  const files = exec(`find . -name output.tgz`, {cwd: bin, encoding: 'utf8'})
    .split('\n')
    .filter(Boolean);
  files.map(f => {
    const target = `${root}/${dirname(f)}`;
    exec(`tar xzf "${f}" -C "${target}"`, {cwd: bin});
  });

  const params = ['--color=always', ...args.map(arg => `'${arg}'`)].join(' ');
  const cmd = `${node} ${main}/node_modules/.bin/flow ${params}`;
  const dir = dirname(realpath(`${main}/package.json`));
  exec(cmd, {cwd: dir, env: process.env, stdio: 'inherit'});
}
