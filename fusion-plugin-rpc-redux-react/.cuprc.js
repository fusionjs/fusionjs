module.exports = {
  babel: {
    presets: [require.resolve('@babel/preset-react')],
    plugins: [require.resolve('babel-plugin-transform-flow-strip-types')],
  },
};
