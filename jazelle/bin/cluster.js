// @flow

/*
This file is an entry point for multi-cpu coordination. See commands/batch.js
*/

const {isMaster, fork} = require('cluster');
const {cpus} = require('os');
const {resolve} = require('path');
const {parse} = require('../utils/parse-argv.js');
const {getManifest} = require('../utils/get-manifest.js');
const {read} = require('../utils/node-helpers.js');
const {groupByDepsets} = require('../utils/group-by-depsets.js');
const {install} = require('../commands/install.js');
const {test} = require('../commands/test.js');
const {lint} = require('../commands/lint.js');
const {flow} = require('../commands/flow.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const {setupSymlinks} = require('../utils/setup-symlinks.js');

const {root, plan, index, cores} = parse(process.argv.slice(2));

run();

async function run() {
  if (isMaster) await runMaster();
  else await runWorker();
}

async function runMaster() {
  const groups = JSON.parse(plan);
  const group = groups[index];

  const availableCores = cores ? parseInt(cores, 10) : cpus().length;

  const {projects} = await getManifest({root});
  const metas = await Promise.all(
    projects.map(async dir => ({
      meta: JSON.parse(await read(`${root}/${dir}/package.json`, 'utf8')),
      dir: `${root}/${dir}`,
      depth: 0,
    }))
  );
  const payload = groupByDepsets({root, metas, group});
  for (const data of payload) {
    if (data.length > 0) {
      const requiredCores = Math.min(availableCores, data.length);
      const workers = [...Array(requiredCores)].map(() => fork());
      await install({
        root,
        cwd: `${root}/${data[0].dir}`,
        frozenLockfile: true,
      });

      // setup symlinks
      const map = new Map();
      await Promise.all(
        data.slice(1).map(async item => {
          const deps = await getLocalDependencies({
            dirs: projects.map(dir => `${root}/${dir}`),
            target: resolve(root, item.dir),
          });
          for (const dep of deps) {
            map.set(dep.dir, dep);
          }
        })
      );
      await setupSymlinks({root, deps: [...map.values()]});

      await Promise.all(
        workers.map(async worker => {
          while (data.length > 0) {
            await new Promise(async (resolve, reject) => {
              const item = data.shift();
              worker.send(item);
              worker.once('message', resolve);
              worker.once('exit', e => {
                if (e) reject();
              });
            });
          }
        })
      );
      for (const worker of workers) worker.kill();
    }
  }
}

async function runWorker() {
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const payload = await new Promise(resolve => {
        process.once('message', resolve);
      });
      if (!payload) break;

      const {dir, action} = payload;
      const cwd = `${root}/${dir}`;

      if (action === 'test') await test({root, cwd, args: []});
      else if (action === 'lint') await lint({root, cwd, args: []});
      else if (action === 'flow') await flow({root, cwd, args: []});

      if (typeof process.send === 'function') process.send(payload);
    }
  } catch (e) {
    process.exit(1);
  }
  process.exit(0);
}
