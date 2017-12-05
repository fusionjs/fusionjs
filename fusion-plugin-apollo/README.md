# fusion-apollo

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

