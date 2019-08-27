// @flow
const {exists, spawn} = require('./node-helpers.js');

/*::
import type {Metadata} from './get-local-dependencies.js';

type SetupSymlinksArgs = {
  root: string,
  bin: string,
  modulesDir: string,
  deps: Array<Metadata>,
}
type SetupSymlinks = (SetupSymlinksArgs) => Promise<void>
*/
const setupSymlinks /*: SetupSymlinks */ = async ({
  root,
  bin,
  modulesDir,
  deps,
}) => {
  await spawn('rm', ['-rf', modulesDir], {cwd: root});
  await spawn('mv', [`${bin}/node_modules`, modulesDir], {cwd: root});

  // symlink local deps
  await Promise.all(
    deps.map(async dep => {
      const [ns, basename] = dep.meta.name.startsWith('@')
        ? dep.meta.name.split('/')
        : ['.', dep.meta.name];
      // symlink from global node_modules to local package folders
      if (!(await exists(`${modulesDir}/${dep.meta.name}`))) {
        await spawn('mkdir', ['-p', `${modulesDir}/${ns}`], {cwd: root});
        await spawn('ln', ['-sf', dep.dir, basename], {
          cwd: `${modulesDir}/${ns}`,
        });
      }

      // symlink node_modules/.bin from local packages to global .bin
      if (!(await exists(`${dep.dir}/node_modules/.bin`))) {
        await spawn('mkdir', ['-p', 'node_modules'], {cwd: dep.dir});
        await spawn('ln', ['-sf', `${modulesDir}/.bin`, '.bin'], {
          cwd: `${dep.dir}/node_modules`,
        });
      }

      // symlink from global node_modules/.bin to local bin scripts
      const bin =
        typeof dep.meta.bin === 'string'
          ? {[dep.meta.name]: dep.meta.bin}
          : dep.meta.bin;
      if (!(await exists(`${modulesDir}/.bin`))) {
        await spawn('mkdir', ['-p', `${modulesDir}/.bin`], {cwd: root});
      }
      for (const cmd in bin) {
        if (!(await exists(`${modulesDir}/.bin/${cmd}`))) {
          await spawn('ln', ['-sf', `${dep.dir}/${bin[cmd]}`, cmd], {
            cwd: `${modulesDir}/.bin`,
          });
        }
      }
    })
  );
};

module.exports = {setupSymlinks};
