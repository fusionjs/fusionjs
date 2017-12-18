# Custom Babel Configuration

## Adding plugins/presets

To add your own Babel plugins/prelease, create a `.fusionrc.js` in the root directory of your application with the following contents:
```
module.exports = {
  babel: {
    presets: ["some-babel-preset"],
    plugins: ["some-babel-plugin"]
  }
};
```

**Please note that custom Babel config is an unstable API and may not be supported in future releases.**
