module.exports = {
  babel: {
    plugins: [require.resolve('./plugin.js')],
  },
  experimentalCompile: true,
};
