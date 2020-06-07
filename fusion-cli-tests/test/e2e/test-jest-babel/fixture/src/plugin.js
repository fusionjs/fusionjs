// @noflow
module.exports = () => ({
  visitor: {
    StringLiteral(path) {
      if (path.node.value === 'helloworld') {
        path.node.value = 'transformed_helloworld_custom_babel';
      }
    },
  },
});
