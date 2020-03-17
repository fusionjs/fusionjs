// @flow
const {getManifest} = require('../utils/get-manifest.js');
const {getLocalDependencies} = require('../utils/get-local-dependencies.js');
const bazel = require('../utils/bazel-commands.js');
const yarn = require('../utils/yarn-commands.js');

/*::
import type {Stdio} from '../utils/node-helpers.js';
export type ExecuteProjectCommandArgs = {
  root: string,
  cwd: string,
  command: string,
  args?: Array<string>,
  stdio?: Stdio,
}
export type ExecuteProjectCommand = (ExecuteProjectCommandArgs) => Promise<void>
*/
const executeProjectCommand /*: ExecuteProjectCommand */ = async ({
  root,
  cwd,
  command,
  args = [],
  stdio = 'inherit',
}) => {
  const {projects, workspace} = await getManifest({root});
  if (workspace === 'sandbox') {
    switch (command) {
      case 'dev':
        return bazel.dev({root, cwd, args});
      case 'test':
        return bazel.test({root, cwd, args, stdio});
      case 'lint':
        return bazel.lint({root, cwd, args, stdio});
      case 'flow':
        return bazel.flow({root, cwd, args, stdio});
      case 'build':
        return bazel.build({root, cwd});
      case 'start':
        return bazel.start({root, cwd, args});
      case 'exec':
        return bazel.exec({root, cwd, args, stdio});
      default:
        return bazel.script({root, cwd, command, args, stdio});
    }
  } else {
    const deps = await getLocalDependencies({
      dirs: projects.map(dir => `${root}/${dir}`),
      target: cwd,
    });
    switch (command) {
      case 'dev':
        return yarn.dev({root, deps, args});
      case 'test':
        return yarn.test({root, deps, args, stdio});
      case 'lint':
        return yarn.lint({root, deps, args, stdio});
      case 'flow':
        return yarn.flow({root, deps, args, stdio});
      case 'build':
        return yarn.build({root, deps});
      case 'start':
        return yarn.start({root, deps, args});
      case 'exec':
        return yarn.exec({root, deps, args, stdio});
      default:
        return yarn.script({root, deps, command, args, stdio});
    }
  }
};

module.exports = {executeProjectCommand};
