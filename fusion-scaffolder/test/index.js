const test = require('tape');
const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const rimrafCb = require('rimraf');
const scaffold = require('../');

const stat = promisify(fs.stat);
const rimraf = promisify(rimrafCb);
const readFile = promisify(fs.readFile);

test('scaffolding with no path', async t => {
  try {
    await scaffold();
  } catch (e) {
    t.ok(e instanceof Error, 'errors out');
    t.end();
  }
});

test('scaffolding with no files in template', async t => {
  try {
    await scaffold({
      path: './test/fixtures/nofiles',
    });
  } catch (e) {
    t.ok(e instanceof Error, 'errors out');
    t.end();
  }
});

test('scaffolding with no project name', async t => {
  try {
    await scaffold({
      cwd: __dirname,
      path: './fixtures/example',
    });
  } catch (e) {
    t.ok(e instanceof Error, 'errors out');
    t.end();
  }
});

test('scaffolding example/', async t => {
  await scaffold({
    cwd: __dirname,
    path: './fixtures/example',
    project: 'foo',
  });

  const projectDir = path.join(__dirname, 'foo');

  const folderStat = await stat(projectDir);
  t.ok(folderStat.isDirectory(), 'project folder is created correctly');

  const fooJsStat = await stat(path.join(projectDir, 'foo.js'));
  t.ok(fooJsStat.isFile(), 'generic files are copied');
  const fooJsContent = await readFile(path.join(projectDir, 'foo.js'), 'utf8');
  t.ok(
    fooJsContent === 'module.exports = {};\n',
    'generic file content is correct'
  );

  const packageJsonStat = await stat(path.join(projectDir, 'package.json'));
  t.ok(
    packageJsonStat.isFile(),
    '.njk files are written without .njk file extension'
  );
  const packageJsonContent = await readFile(
    path.join(projectDir, 'package.json'),
    'utf8'
  );
  t.ok(
    packageJsonContent === `{\n  "name": "foo"\n}\n`,
    '.njk files are compiled correctly'
  );

  const dotGitignoreStat = await stat(path.join(projectDir, '.gitignore'));
  t.ok(dotGitignoreStat.isFile(), 'copies dot files');

  const scriptShStat = await stat(path.join(projectDir, 'script.sh'));
  t.ok(
    scriptShStat.mode === 33261,
    'executable files are copied with the same mode'
  );

  const script2ShStat = await stat(path.join(projectDir, 'script2.sh'));
  t.ok(
    script2ShStat.mode === 33261,
    'executable .njk files are written with the same mode'
  );

  await rimraf(projectDir);
  await t.end();
});
