# fusion-plugin-styletron-react

[![Build status](https://badge.buildkite.com/00a3de3f63ee3ceb9079ba866255300dda30a4b5db5e2e47da.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-styletron-react)

The Fusion plugin for [Styletron](https://github.com/rtsao/styletron), a component-oriented styling toolkit based on style objects. This plugin automatically sets up server-side rendering and provides an [atomic CSS](https://ryantsao.com/blog/virtual-css-with-styletron) [rendering engine](https://github.com/rtsao/styletron/tree/master/packages/styletron-engine-atomic) to your [styled components](https://github.com/rtsao/styletron/tree/master/packages/styletron-react).

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

  app.register(Styletron);

  return app;
}
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
