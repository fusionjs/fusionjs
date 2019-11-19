// @noflow
module.exports = () => ({
  visitor: {
    StringLiteral(path) {
      if (path.node.value === 'helloworld') {
        path.node.value = this.opts.testFunction();
      }
    },
  },
});
