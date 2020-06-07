// @flow
// eslint-disable-next-line import/no-unresolved
require('@uber/b');

const {existsSync: exists, mkdirSync: mkdir, writeFileSync: write} = require('fs');
const cwd = process.cwd();

if (!exists(`${cwd}/generated`)) mkdir(`${cwd}/generated`);
write(`${cwd}/generated/foo.txt`, 'hello', 'utf8');

if (!exists(`${cwd}/generated_but_not_src`)) mkdir(`${cwd}/generated_but_not_src`);
write(`${cwd}/generated_but_not_src/foo.txt`, 'hello', 'utf8');