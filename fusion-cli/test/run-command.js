/* eslint-env node */
const {spawn} = require('child_process');
module.exports = function run(command, options) {
  const child = spawn('node', ['-e', command], options);
  const stdoutLines = [];
  const stderrLines = [];
  return new Promise((resolve, reject) => {
    child.stdout.on('data', data => {
      stdoutLines.push(data.toString());
    });
    child.stderr.on('data', data => {
      stderrLines.push(data.toString());
    });
    child.on('close', code => {
      const stdout = stdoutLines.join('\n');
      const stderr = stderrLines.join('\n');
      if (code === 0) {
        resolve({stdout, stderr});
      } else {
        reject({stdout, stderr, code});
      }
    });
    child.on('error', e => {
      reject(e);
    });
  });
};
