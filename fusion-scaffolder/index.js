/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const fs = require('fs');
const mkdirpCb = require('mkdirp');
const {render} = require('nunjucks');
const {join, relative, dirname, extname} = require('path');
const {promisify} = require('util');
const readdir = require('recursive-readdir');
const {spawn} = require('child_process');

const copyFile = promisify(fs.copyFile);
const lstat = promisify(fs.lstat);
const mkdirp = promisify(mkdirpCb);
const writeFile = promisify(fs.writeFile);

/*::
type ScaffoldContext = {
  cwd?: string,
  path?: string,
  project?: string,
  projectPath?: string,
  packageJsonFields?: {
    [string]: any
  },
};
*/

module.exports = async function scaffold(ctx /*: ScaffoldContext */ = {}) {
  if (!ctx.cwd) {
    ctx.cwd = process.cwd();
  }

  const {cwd, path, project, projectPath, packageJsonFields} = ctx;

  if (!path) {
    throw new Error(
      "No template path was passed. There's nothing to scaffold. Please pass a `path` option specifying the directory of the scaffold template."
    );
  }

  if (!project) {
    throw new Error(
      'No project name was passed. Please pass a `project` option to specify the name of your newly scaffolded project.'
    );
  }

  const computedProjectPath = projectPath || join(cwd, project);
  const templatePath = join(cwd, path);
  const contentPath = join(templatePath, 'content');

  await compile(computedProjectPath, templatePath, contentPath, ctx);
  await updatePackageJsonFields(computedProjectPath, packageJsonFields);
  await install(computedProjectPath);
};

async function updatePackageJsonFields(projectPath, packageJsonFields = null) {
  if (!packageJsonFields) {
    return;
  }

  // Setup package.json files, as we can't have these in the source code because publishing will fail.
  const packageJsonPath = `${projectPath}/package.json`;
  // $FlowFixMe
  let packageContent = require(packageJsonPath); // eslint-disable-line import/no-dynamic-require
  packageContent = {...packageContent, ...packageJsonFields};
  packageContent.files = ['dist', 'src'];
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageContent, null, '  '));
}

async function compile(projectPath, templatePath, contentPath, ctx) {
  // Get context from index.js
  /* eslint-disable import/no-dynamic-require */
  // $FlowFixMe
  const getContext = require(join(templatePath, 'index.js'));
  /* eslint-enable import/no-dynamic-require */
  const newCtx = await getContext(ctx);

  // Get all template files
  const files = await readdir(contentPath);

  return await Promise.all(
    files.map(async (filePath) => {
      const relativeFilePath = relative(contentPath, filePath);
      const newFilePath = join(projectPath, relativeFilePath);
      const newFileDir = dirname(newFilePath);

      // Create directories to new file
      await mkdirp(newFileDir);

      // If is nunjucks template, compile and remove .njk extension
      const fileExt = extname(newFilePath);
      if (fileExt === '.njk') {
        // Need to stat file for copy file mode
        const fileStat = await lstat(filePath);
        const compiledContents = render(filePath, newCtx);
        const withoutNjkFilePath = newFilePath.replace(/\.njk$/, '');
        return await writeFile(withoutNjkFilePath, compiledContents, {
          mode: fileStat.mode,
        });
      }

      // Otherwise, copy file unchanged
      return await copyFile(filePath, newFilePath);
    })
  );
}

async function install(projectPath) {
  return new Promise((resolve, reject) => {
    let child;
    if (!/^win/.test(process.platform)) {
      // linux
      child = spawn('yarn', ['install', '--cwd', projectPath], {
        stdio: 'inherit',
      });
    } else {
      // windows
      child = spawn(
        'cmd',
        ['/s', '/c', 'yarn', 'install', '--cwd', projectPath],
        {
          stdio: 'inherit',
        }
      );
    }
    child.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            'Error running `yarn install`; however, the template has been successfully scaffolded.'
          )
        );
      }
      resolve();
    });
  });
}
