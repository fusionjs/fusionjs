# fusion-test-utils

Provides test utility functions for FusionJS

---

```sh
yarn add fusion-test-utils
```

### Example

```js
import App from 'fusion-core';
import {mockContext} from 'fusion-test-utils';

const app = new App();
let ctx = mockContext();
await app.simulate(ctx);
// do assertions on ctx

let ctx = mockContext({path: '/'}); // argument is merged into mock req object
await app.simulate(ctx);
// do assertions on ctx
```


#### Browser context

Browsers send an `accept: 'text/html'` header, which can determine whether a SSR happens. Using the `browser()` method will ensure this header is set.

```js
const app = new App();
let ctx = mockContext.browser();
await app.simulate(ctx);
// do assertions on ctx
```

---
