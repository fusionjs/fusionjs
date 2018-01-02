module.exports = {
  extends: [require.resolve('eslint-config-uber-node-lts')],

  parserOptions: {
    ecmaVersion: 2017,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
  },

  env: {
    node: true,
  },
};
