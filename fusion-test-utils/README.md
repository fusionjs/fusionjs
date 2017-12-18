# fusion-test-utils

[![Build status](https://badge.buildkite.com/830e5ff24d46977835ad18ae693019740e07413e091581905e.svg?branch=master)](https://buildkite.com/uberopensource/fusion-test-utils)

Provides test utility functions for FusionJS

---

```sh
yarn add fusion-test-utils
```

### Example

```js
import App from 'fusion-core';
import {render, request} from 'fusion-test-utils';

// test renders of your application
const app = new App();
const ctx = await render(app, '/test-url', {
  headers: {
    'x-header': 'value',
  }
});
// do assertions on ctx

// test requests to your application
const app = new App();
const ctx = await request(app, '/test-url', {
  headers: {
    'x-header': 'value',
  }
});
// do assertions on ctx
```

---

### API

#### `request(app: FusionApp, url: String, options: ?Object)` => Promise<ctx>

Simulates a request through your application.
`app` - instance of a FusionApp
`url` - path for request
`options` - optional object containing custom settings for the request
`options.method` - the request method, e.g., GET, POST,
`options.headers` - headers to be added to the request
`options.body` - body for the request

#### `render(app: FusionApp, url: String, options: ?Object)` => Promise<ctx>

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
});

test('async functions', async assert => {
  const value = await doSomething();
  assert.equal(true, value, 'something is equal to true');
});
```
