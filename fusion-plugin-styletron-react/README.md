# fusion-plugin-styletron-react

[![Build status](https://badge.buildkite.com/4c8b6bc04b61175d66d26b54b1d88d52e24fecb1b537c54551.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

The Fusion plugin for [Styletron](https://github.com/rtsao/styletron), a component-oriented styling toolkit based on style objects. This plugin automatically sets up server-side rendering and provides an [atomic CSS](https://ryantsao.com/blog/virtual-css-with-styletron) [rendering engine](https://github.com/rtsao/styletron/tree/master/packages/styletron-engine-atomic) to your [styled components](https://github.com/rtsao/styletron/tree/master/packages/styletron-react).

---

## Installation

```sh
yarn add fusion-plugin-styletron-react styletron-react
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

  app.register(Styletron);

  return app;
}
```

### Atomic class prefix

By default, it is assumed there is no global CSS that will result in collisions with the generated atomic class names. If this is not the case, collisions can be avoided by adding a prefix to the generated atomic class names via `AtomicPrefixToken`.

```js
import Styletron, {AtomicPrefixToken} from 'fusion-plugin-styletron-react';

app.register(Styletron);
app.register(AtomicPrefixToken, "_");
```

### Creating styled components
For API details and usage examples, see [the official `styletron-react` documentation](https://github.com/rtsao/styletron/tree/master/packages/styletron-react)

```js
// src/components/root.js
import react from 'react';
import {styled} from 'fusion-plugin-styletron-react';

const Panel = styled('div', props => {
  return {
    backgroundColor: props.$color || 'Silver'
  };
});

export default <Panel color="SteelBlue">Hello</Panel>;
```


---
