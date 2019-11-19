module.exports = {
  babel: {
    plugins: [[require.resolve('./plugin.js'), {
      testFunction: () => {
        return 'transformed_custom_babel';
      }
    }]],
  },
  experimentalCompile: true,
};
