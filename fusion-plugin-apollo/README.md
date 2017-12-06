# fusion-apollo

[![Build status](https://badge.buildkite.com/2ac76cfb209dae257969b7464a2c90834ed82705cfd5bfcc52.svg?branch=master)](https://buildkite.com/uberopensource/fusion-apollo)

FusionJS entry point for React universal rendering /w Apollo

---

### Installation

```sh
yarn add fusion-apollo
```

---

### Example

```js
// ./src/main.js
import React from 'react';
import App from 'fusion-apollo';
import createApolloClient from 'fusion-apollo-universal-client';

export default function() {
  const apolloClient = createApolloClient(clientConfig);
  return new App(<Hello />, apolloClient);
}
```

