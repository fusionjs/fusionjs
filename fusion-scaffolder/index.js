const fs = require('fs');
const mkdirpCb = require('mkdirp');
const nunjucks = require('nunjucks');
const path = require('path');
const {promisify} = require('util');
const readdir = require('recursive-readdir');

const copyFile = promisify(fs.copyFile);
const lstat = promisify(fs.lstat);
const mkdirp = promisify(mkdirpCb);
const writeFile = promisify(fs.writeFile);

module.exports = async function scaffold(options = {}) {
  if (!options.path) {
    throw new Error(
      "No template path was passed. There's nothing to scaffold. Please pass a `path` to the directory of the scaffold template."
    );
  }

  if (!options.cwd) {
    options.cwd = process.cwd();
  }

  if (!options.project) {
    throw new Error(
      'No project name was passed. Please pass a `project` option to set the name of your newly scaffolded project.'
    );
  }

  const projectPath = path.join(options.cwd, options.project);
  const templatePath = path.join(options.cwd, options.path);
  const contentPath = path.join(templatePath, 'content');

  // Get all template files
  const files = await readdir(contentPath);

  return await Promise.all(
    files.map(async filePath => {
      const relativeFilePath = path.relative(contentPath, filePath);
      const newFilePath = path.join(projectPath, relativeFilePath);
      const newFileDir = path.dirname(newFilePath);

      // Create directories to new file
      await mkdirp(newFileDir);

      // If is nunjucks template, compile and remove .njk extension
      const fileExt = path.extname(newFilePath);
      if (fileExt === '.njk') {
        // Need to stat file for copy file mode
        const fileStat = await lstat(filePath);
        const compiledContents = nunjucks.render(filePath, options);
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
