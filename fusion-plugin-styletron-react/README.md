# fusion-plugin-styletron-react

The Fusion plugin for [Styletron](http://styletron.js.org/), which, in addition to providing a easy-to-use styled-component-like interface, provides [powerful server-side CSS optimizations](https://ryantsao.com/blog/virtual-css-with-styletron), yielding less CSS code down the wire.

---

## Installation

```sh
yarn add fusion-plugin-styletron-react
```

## Usage


### Plugin registration
```js
// src/main.js
import App from 'fusion-react';
import Styletron from 'fusion-plugin-styletron-react';

import root from './components/root';

export default () => {
  const app = new App(root);

  app.plugin(Styletron);

  return app;
}
```

### Creating styled components
For API details and usage examples, checkout [the official documentation for Styletron](http://styletron.js.org/global.html#styled)

```js
// src/components/root.js
import react from 'react';
import {styled} from 'fusion-plugin-styletron-react';

const Panel = styled('div', props => {
  return {
    backgroundColor: props.color || 'Silver'
  };
});

export default <Panel color="SteelBlue">Hello</Panel>;
```


---
