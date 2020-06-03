// @flow
const {
  existsSync: exists,
  readFileSync: read,
  readdirSync: readdir,
  realpathSync: realpath,
  statSync: stat,
} = require('fs');
const {execSync: exec} = require('child_process');
const {dirname, join, relative} = require('path');

const root = process.cwd();
const [node, , main, , command, distPaths, gen, out, ...args] = process.argv;
const dists = distPaths.split('|');

const {scripts = {}} = JSON.parse(read(`${main}/package.json`, 'utf8'));

if (out) {
  runCommands(command, args);
  const dirs = dists.map(dist => `"${dist}"`).join(' ');
  for (const dist of dists) {
    if (!exists(join(main, dist))) {
      exec(`mkdir -p "${dist}"`, {cwd: main});
    }
  }
  exec(`tar czf "${out}" ${dirs}`, {cwd: main});
} else {
  runCommands(command, args);

  // handle `gen_srcs`:
  // - if the command generates file (e.g. jest snapshots), copy them back to the source dir
  // - if the files already exist, they are updated through Bazel's symlink and the copy is not needed
  generateSources({root, main, regexes: gen.split('|').filter(Boolean)});
}

function runCommands(command, args) {
  if (command.startsWith('yarn ')) {
    runCommand(command.substr(5), args);
    return;
  }
  if (command === 'run') {
    command = args.shift();
  }
  runCommand(scripts[`pre${command}`]);
  runCommand(scripts[command], args);
  runCommand(scripts[`post${command}`]);
}

function runCommand(command, args = []) {
  if (command) {
    const nodeDir = dirname(node);
    const params = args.map(arg => `'${arg}'`).join(' ');
    // prioritize hermetic Node version over system version
    const binPath = `:${root}/node_modules/.bin`;
    if (process.env.NODE_PRESERVE_SYMLINKS) {
      const bins = readdir('node_modules/.bin');
      const items = command.split(' ');
      let matchingBin = null;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (bins.includes(item)) {
          if (
            read(join('node_modules/.bin', item), 'utf-8')
              .split('\n')[0]
              .trim()
              .endsWith('node')
          ) {
            matchingBin = item;
            break;
          }
        }
      }
      if (matchingBin) {
        const realBin = realpath(join('node_modules/.bin', matchingBin));
        let pathToUse = join(
          process.cwd(),
          'node_modules',
          realBin.split('node_modules').pop()
        );

        if (exists(pathToUse)) {
          command = command.replace(
            matchingBin,
            `node --preserve-symlinks-main ${pathToUse}`
          );
        }
      }
    }
    const script = `export PATH=${nodeDir}${binPath}:$PATH; ${command} ${params}`;
    try {
      exec(script, {cwd: main, env: process.env, stdio: 'inherit'});
    } catch (e) {
      process.exit(1);
    }
  }
}

function generateSources({root, main, regexes}) {
  const dir = dirname(relative(root, `${main}/package.json`));
  const realDir = dirname(realpath(`${main}/package.json`));
  const relSandbox = relative(root, dir);
  const real = realDir.replace(`/${relSandbox}`, '');
  for (const regex of regexes) {
    const sandboxed = find({root, regex: new RegExp(regex)});
    for (const item of sandboxed) {
      const rel = relative(root, item);
      const sandboxedPath = `${root}/${rel}`;
      const gensrcPath = `${real}/${rel}`;
      const copy = `cp -rf ${sandboxedPath} ${gensrcPath}`;
      if (!exists(gensrcPath)) {
        exec(copy, {cwd: root});
      }
    }
  }
}

function* find({root, regex}) {
  const dirs = readdir(root);
  for (const dir of dirs) {
    const path = `${root}/${dir}`;
    const s = stat(`${root}/${dir}`);
    if (path.match(regex)) yield path;
    if (s.isDirectory()) yield* find({root: path, regex});
  }
}
