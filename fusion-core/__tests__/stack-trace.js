/* @flow */
/* global __filename */

import ClientAppFactory from '../src/client-app';
import ServerAppFactory from '../src/server-app';
import {createPlugin} from '../src/create-plugin';
import {createToken} from '../src/create-token';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();

const thisFileRegex = new RegExp(`${__filename}:\\d+:\\d+`);

test('create-plugin filters error stack', function createPluginTest() {
  const plugin = createPlugin({});
  const callLocation = plugin.stack
    .split('\n')[1]
    .replace(thisFileRegex, 'this-file')
    .trim();
  expect(callLocation).toMatchInlineSnapshot(
    `"at Object.createPluginTest (this-file)"`
  );
});

test('create-token filters error stack', function createTokenTest() {
  const token = createToken('token');
  const callLocations = token.stacks.reduce((acc, stack) => {
    acc[stack.type] = stack.stack
      .split('\n')[1]
      .replace(thisFileRegex, 'this-file')
      .trim();
    return acc;
  }, {});
  expect(callLocations).toMatchInlineSnapshot(`
    Object {
      "token": "at Object.createTokenTest (this-file)",
    }
  `);
});

test('register filters error stack', function registerTest() {
  const token = createToken('token');
  const plugin = createPlugin({});

  function srcMain() {
    const app = new App('el', el => el);
    app.register(token, plugin);
  }

  // src/main.js
  srcMain();

  const callLocations = token.stacks.reduce((acc, stack) => {
    acc[stack.type] = stack.stack
      .split('\n')[1]
      .replace(thisFileRegex, 'this-file')
      .trim();
    return acc;
  }, {});
  expect(callLocations).toMatchInlineSnapshot(`
    Object {
      "plugin": "at Object.registerTest (this-file)",
      "register": "at srcMain (this-file)",
      "token": "at Object.registerTest (this-file)",
    }
  `);
});

test('enhance filters error stack', function enhanceTest() {
  const token = createToken('token');
  const plugin = createPlugin({});
  const enhancer = obj => obj;

  function srcMain() {
    const app = new App('el', el => el);
    app.register(token, plugin);
    app.enhance(token, enhancer);
  }

  // src/main.js
  srcMain();

  const callLocations = token.stacks.reduce((acc, stack) => {
    acc[stack.type] = stack.stack
      .split('\n')[1]
      .replace(thisFileRegex, 'this-file')
      .trim();
    return acc;
  }, {});
  expect(callLocations).toMatchInlineSnapshot(`
    Object {
      "enhance": "at srcMain (this-file)",
      "plugin": "at Object.enhanceTest (this-file)",
      "register": "at srcMain (this-file)",
      "token": "at Object.enhanceTest (this-file)",
    }
  `);
});

test('alias filters error stack', function aliasTest() {
  const fromToken = createToken('from-token');
  const toToken = createToken('to-token');

  const token = createToken('token');
  const plugin = createPlugin({
    deps: {
      dep: fromToken,
    },
  });

  function srcMain() {
    const app = new App('el', el => el);
    app.register(token, plugin).alias(fromToken, toToken);
  }

  // src/main.js
  srcMain();

  const fromCallLocations = fromToken.stacks.reduce((acc, stack) => {
    acc[stack.type] = stack.stack
      .split('\n')[1]
      .replace(thisFileRegex, 'this-file')
      .trim();
    return acc;
  }, {});
  expect(fromCallLocations).toMatchInlineSnapshot(`
    Object {
      "alias-from": "at srcMain (this-file)",
      "token": "at Object.aliasTest (this-file)",
    }
  `);

  const toCallLocations = toToken.stacks.reduce((acc, stack) => {
    acc[stack.type] = stack.stack
      .split('\n')[1]
      .replace(thisFileRegex, 'this-file')
      .trim();
    return acc;
  }, {});
  expect(toCallLocations).toMatchInlineSnapshot(`
    Object {
      "alias-to": "at srcMain (this-file)",
      "token": "at Object.aliasTest (this-file)",
    }
  `);
});
