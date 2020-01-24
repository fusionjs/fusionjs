// @noflow
const {execSync} = require('child_process');

module.exports = () => {
  return {
    visitor: {
      StringLiteral(path /* : any */) {
        if (path.node.value === 'TRIGGER-BABEL-DELAY') {
          console.log('Triggered babel delay');
          execSync('sleep 5');
        }
      },
    },
  };
};
