# fusion-test-utils

[![Build status](https://badge.buildkite.com/830e5ff24d46977835ad18ae693019740e07413e091581905e.svg?branch=master)](https://buildkite.com/uberopensource/fusion-test-utils)

Provides test utility functions for Fusion.js

---

```sh
yarn add fusion-test-utils
```

### Example

```js
import App from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';

// create simulator
const app = new App();
const simulator = getSimulator(app /*, (optional) test plugin with assertions on dependencies */);

// test renders of your application
const ctx = await simulator.render('/test-url', {
  headers: {
    'x-header': 'value',
  }
});
// do assertions on ctx

// test requests to your application
const ctx = await simulator.request('/test-url', {
  headers: {
    'x-header': 'value',
  }
});
// do assertions on ctx
```

---

### API

#### `getSimulator(app: FusionApp, testPlugin?: FusionPlugin) => { request, render }`

Creates a simulator which exposes functionality to simulate requests and renders through your application.
`app` - instance of a FusionApp
`testPlugin` - optional plugin to make assertions on dependencies

#### `getSimulator(...).request(url: String, options: ?Object)` => Promise<ctx>

Simulates a request through your application.
`url` - path for request
`options` - optional object containing custom settings for the request
`options.method` - the request method, e.g., GET, POST,
`options.headers` - headers to be added to the request
`options.body` - body for the request

#### `getSimulator(...).render(url: String, options: ?Object)` => Promise<ctx>

This is the same as `request`, but defaults the `accept` header to `text/html` which will trigger a render of your application.

#### `test(testName: String, executor: (assert) => {})`

A block which executes a test case when using [fusion-cli](https://github.com/fusionjs/fusion-cli) as a test runner. The first argument is the name of the test, and the second argument is a function that executes your test code. The test case will receive a cross-environment assertion helper with all methods defined in the [assert module](https://nodejs.org/api/assert.html), as well as a `.matchSnapshot()` method.

Example usage:
```js
import React from 'react';
import {test} from 'fusion-test-utils';
import {shallow} from 'enzyme';

import MyComponent from '../my-component';

test('MyComponent snapshot', assert => {
  const wrapper = shallow(<MyComponent />);
  assert.matchSnapshot(wrapper);
  // And optionally, you can pass your own snapshot name as the second argument
  assert.matchSnapshot(wrapper, 'my snapshot description');
});

test('async functions', async assert => {
  const value = await doSomething();
  assert.equal(true, value, 'something is equal to true');
});
```

#### `mockFunction()`

Returns a mock function which allows you to inspect the mock state via the .mock property.
Example usage:
```js
import {mockFunction, test} from '../index';

test('function mocks', assert => {
  const myMock = mockFunction();
  myMock();
  assert.equal(myMock.mock.calls.length, 1);
});
```
