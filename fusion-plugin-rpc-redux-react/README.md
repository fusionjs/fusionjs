# fusion-plugin-rpc-redux-react

[![Build status](https://badge.buildkite.com/c16ece6ba0a81b30d11d69cb90b8f4d77a0967860144d12f44.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-rpc-redux-react)

A plugin for integrating web-rpc, redux, and react.

---

### Installation

```sh
yarn add fusion-plugin-rpc-redux-react
```

---

### Example

```js
// src/main.js
import App from 'fusion-react';
import UniversalEventsPlugin from 'fusion-plugin-universal-events';
import ReduxPlugin from 'fusion-plugin-react-redux';
import RPCPlugin from 'fusion-plugin-rpc-redux-react';

import reducer from './reducer';
import handlers from './rpc';

export default () => {
  const app = new App(root);

  const EventEmitter = app.plugin(UniversalEventsPlugin, {fetch});
  app.plugin(ReduxPlugin, {reducer});
  app.plugin(RPCPlugin, __NODE__ ? {handlers, EventEmitter} : {fetch});
}

// src/reducer.js
import {createRPCReducer} from 'fusion-plugin-rpc-redux-react';
export default createRPCReducer('increment', {
  start: (state, action) => ({count: state.count, loading: true, error: ''});
  success: (state, action) => ({count: action.payload.count, loading: false, error: ''});
  failure: (state, action) => ({count: state.count, loading: false, error: action.payload.error});
});

// src/rpc.js
export default {
  getCount() {
    return 0;
  },
  increment() {
    return db.query(/* ... */).then(n => ({count: n}));
  }
}

// src/root.js
import React from 'react';
import {withRPCRedux} from 'fusion-plugin-rpc-redux-react';
import {connect} from 'react-redux';
import {compose} from 'redux';

function Example({count, loading, error, increment}) {
  return (
    <div>
      <p>Count: {count}</p>
      <p>
        <button onClick={() => increment()}>Increment</button>
      </p>
      {loading && 'Loading...'}
      {error}
    </div>
  );
}

const hoc = compose(
  withRPCRedux('increment'),
  connect(({count, loading, error}) => ({count, loading, error})),
);
export default hoc(Example);
```

### Usage with Reactors

```js
// add the reactor enhancer in src/main.js
import {reactorEnhancer} from 'redux-reactors'
// ...
app.plugin(ReduxPlugin, {reducer, enhancer: reactorEnhancer});

// define a reactor (src/reactors/increment.js)
import {withRPCReactor} from 'fusion-plugin-rpc-redux-react';
export const incrementReactor = withRPCReactor('increment', {
  start: (state, action) => ({count: state.count, loading: true, error: ''});
  success: (state, action) => ({count: action.payload.count, loading: false, error: ''});
  failure: (state, action) => ({count: state.count, loading: false, error: action.payload.error});
});

// use the higher order component (src/components/example.js)
import React from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {incrementReactor} from './reactors/increment.js'

function Example({count, loading, error, increment}) {
  return (
    <div>
      <p>Count: {count}</p>
      <p>
        <button onClick={() => increment()}>Increment</button>
      </p>
      {loading && 'Loading...'}
      {error}
    </div>
  );
}

const hoc = compose(
  incrementReactor,
  connect(({count, loading, error}) => ({count, loading, error})),
);
export default hoc(Example);
```
---

### API

#### `withRPCRedux`

```js
import {withRPCRedux} from 'fusion-plugin-rpc-redux-react';
const NewComponent = withRPCRedux('rpcId', {
  propName: '', // optional, defaults to rpcId
  mapStateToParams: (state) => ({}), // optional
  transformParams(params) => ({}), // optional
})(Component)
```

#### `withRPCReactor`
```js
import {withRPCReactor} from 'fusion-plugin-rpc-redux-react';
const NewComponent = withRPCReactor('rpcId', {
  start: (state, action) => newState, // optional
  success: (state, action) => newState, // optional
  failure: (state, action) => newState, // optional
},
{
  propName: '', // optional, defaults to rpcId
  mapStateToParams: (state) => ({}), // optional
  transformParams(params) => ({}), // optional
})(Component);
```
