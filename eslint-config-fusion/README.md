# eslint-config-fusion

[![Build status](https://badge.buildkite.com/4c8b6bc04b61175d66d26b54b1d88d52e24fecb1b537c54551.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

`eslint-config-fusion` is an [eslint](https://www.github.com/eslint/eslint) config recommended for use with Fusion.js.

## Usage

Extend `eslint-config-fusion` in your `.eslintrc.js`:

```js
module.exports = {
  extends: [
    require.resolve('eslint-config-fusion')
  ]
};
```
