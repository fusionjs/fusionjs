const fs = require('fs');
const mkdirpCb = require('mkdirp');
const {render} = require('nunjucks');
const {join, relative, dirname, extname} = require('path');
const {promisify} = require('util');
const readdir = require('recursive-readdir');

const copyFile = promisify(fs.copyFile);
const lstat = promisify(fs.lstat);
const mkdirp = promisify(mkdirpCb);
const writeFile = promisify(fs.writeFile);

module.exports = async function scaffold(ctx = {}) {
  if (!ctx.cwd) {
    ctx.cwd = process.cwd();
  }

  const {cwd, path, project} = ctx;

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

  const projectPath = join(cwd, project);
  const templatePath = join(cwd, path);
  const contentPath = join(templatePath, 'content');

  // Get context from index.js
  const getContext = require(join(templatePath, 'index.js'));
  const newCtx = await getContext(ctx);

  // Get all template files
  const files = await readdir(contentPath);

  return await Promise.all(
    files.map(async filePath => {
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
};
