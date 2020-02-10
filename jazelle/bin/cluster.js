// @flow

/*
This file is an entry point for multi-cpu coordination. See commands/batch.js or commands/each.js
*/

const {isMaster, fork} = require('cluster');
const {cpus, tmpdir} = require('os');
const {resolve} = require('path');
const {createWriteStream} = require('fs');
const {parse} = require('../utils/parse-argv.js');
const {getManifest} = require('../utils/get-manifest.js');
const {read, write, remove, exists} = require('../utils/node-helpers.js');
const {groupByDepsets} = require('../utils/group-by-depsets.js');
const {install} = require('../commands/install.js');
const {test} = require('../commands/test.js');
const {lint} = require('../commands/lint.js');
const {flow} = require('../commands/flow.js');
const {exec} = require('../commands/exec.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const {setupSymlinks} = require('../utils/setup-symlinks.js');

const {root, plan, index, cores, log} = parse(process.argv.slice(2));

run();

async function run() {
  if (isMaster) await runMaster();
  else await runWorker();
}

async function runMaster() {
  const groups = JSON.parse(plan);
  const group = groups[index];
  const errors = [];

  const availableCores = cores ? parseInt(cores, 10) : cpus().length - 1 || 1;

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
      const workers = [...Array(requiredCores)].map(() => fork(process.env));

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

      try {
        await Promise.all(
          workers.map(async worker => {
            while (data.length > 0) {
              await new Promise(async (resolve, reject) => {
                const command = data.shift();
                const log = `${tmpdir()}/${Math.random() * 1e17}`;

                if (worker.state === 'dead') worker = fork(process.env);

                worker.send({command, log});
                worker.once('exit', async () => {
                  // 3) ...then we collect the error from each worker...
                  if (await exists(log)) {
                    const stderr = await read(log, 'utf8');
                    errors.push({command, stderr});
                    await remove(log);
                  }
                  resolve();
                });
              });
            }
          })
        );
      } finally {
        // 4) ...then kill the workers again (because otherwise it may stay up as zombies for whatever reason)...
        for (const worker of workers) worker.kill();
      }
    }
  }
  // 5) ...finally write the full error log to the master log file that was passed by batch-test-group.js
  if (errors.length > 0) await write(log, JSON.stringify(errors));
}

async function runWorker() {
  const payload = await new Promise(resolve => {
    process.once('message', resolve);
  });
  if (!payload) return;

  const {command, log} = payload;
  const {dir, action, args} = command;
  const cwd = `${root}/${dir}`;

  const stream = createWriteStream(log);
  await new Promise(resolve => stream.on('open', resolve));
  const stdio = ['inherit', 'inherit', stream];

  try {
    // 1) if the command fails, throw from this block...
    if (action === 'test') await test({root, cwd, args, stdio});
    else if (action === 'lint') await lint({root, cwd, args, stdio});
    else if (action === 'flow') await flow({root, cwd, args, stdio});
    else if (action === 'exec') await exec({root, cwd, args, stdio});

    if (await exists(log)) await remove(log); // if command succeeds, don't log errors
    process.exit(0);
  } catch (e) {
    // 2) ...which exits the worker process w/ a log file in disk...
    stream.write(`\n${e.stack}`);
    process.exit(1);
  }
}
