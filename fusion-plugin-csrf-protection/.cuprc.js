module.exports = {
  babel: {
    plugins: [require.resolve('babel-plugin-transform-flow-strip-types')],
    presets: [require.resolve('babel-preset-react')],
  },
};
