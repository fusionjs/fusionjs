# fusion-plugin-font-loader-react

[![Build status](https://badge.buildkite.com/a09fc8cc2c13e72534ae4e791fb891753489fb80e02d82021b.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-font-loader-react)

Provides :
1. A fusion plugin that generates @font-faces and preloads fallback fonts based on app-level font configuration.
2. A Higher Order Component for loading custom web fonts (and associated utils). During font loading, this HOC temporarily swaps the element to a well-matched fallback font, avoiding FOIT and FOUT. See https://www.zachleat.com/web/comprehensive-webfonts/#critical-foft-preload for more on this.

---

### Installation

```
yarn add fusion-plugin-font-loading
```

---

### Example

```js
// src/main.js
import App rom 'fusion-core';
import FontLoaderReactPlugin, {
  FontLoaderReactConfigToken
} from 'fusion-plugin-font-loader-react';

export default () => {
  const app = new App(<div></div>);
  // ...
  app.register(FontLoaderReactConfigToken, {/*some config*/});
  app.register(FontLoaderReact);
  // ...
  return app;
}

// src/some-component.js
import {withFontLoading} from 'fusion-plugin-font-loader-react';

const FancyLink1 = withFontLoading('Lato-Bold'.(
  styled('a', props => ({
    ':hover': {fontSize: `${props.answer}px`}.
    ...props.$fontStyles,
  }))
);
```

---

### Usage

#### Configuration
Consuming apps should define a `font-config.js` which a) provides data for @font-face generation, b) is used to derive the fallback font and styles that will be used by the `with-font-loading.js` HOC.

_Sample \<app\>/src/font-config.js file_
```js
import {assetUrl} from 'fusion-core';
export const preloadDepth = 1;
export const fonts = {
  'Lato-Regular': {
    urls: {
      woff: assetUrl('../static/Lato-Regular.woff'),
      woff2: assetUrl('../static/Lato-Regular.woff2'),
    },
    fallback: {
      name: 'Helvetica',
    },
  },
  'Lato-Bold': {
    urls: {
      woff: assetUrl('../static/Lato-Bold.woff')
      woff2: assetUrl('../static/Lato-Bold.woff2'),
    },
    fallback: {
      name: 'Lato-Regular',
      styles: {
        'font-weight': 'bold',
      },
    },
  },
  'Lato-Thin': {
    urls: {
      woff: assetUrl('../static/Lato-Thin.woff'),
      woff2: assetUrl('./static/Lato-Thin.woff2'),
    },
    fallback: {
      name: 'Lato-Regular',
      styles: {
        'font-weight': '100',
      },
    },
  },
};
```

##### @font-face generation

Based on the example configuration file above the following @font-face would typically be generated in <head>

```css
@font-face {font-family: "Lato-Regular"; src: url("/_static/ca614426b50ca7d007056aa00954764b.woff2") format("woff2");}
@font-face {font-family: "Lato-Bold"; src: url("/_static/ca104da8af9a2e0771e8fe2b31f8ec1e.woff2") format("woff2");}
@font-face {font-family: "Lato-Thin"; src: url("/_static/03b64805a8cd2d53fadc5814445c2fb5.woff2") format("woff2");}
```

##### font loading

1. An in-memory font fallback tree is generated at runtime based on the defintitions provided in `font-config.js`
2. Fallbacks at and above the specified `preloadDepth` will be preloaded/prefetched on page load
3. Remaining fonts will lazily loaded.

Based on the sample config above (`preloadDepth` is set to 1), the HOC example above would yield the following values for `prop.$fontStyles`:

while loading font:
```js
{
  fontFamily: 'Lato-Regular'
  fontWeight: 'bold'
}
```

when font is loaded:
```js
{
  fontFamily: 'Lato-Bold'
}
```

If `preloadDepth` were 0 then every font would be preloaded, and there would be no fallback fonts

If `preloadDepth` were 2 then the only fallback font would be Helvetica, and since Helvetica is a system font, no custom fonts would be preloaded.

#### Higher Order Component

This repo also supplies a `with-font-loading.js` Higher Order Component which is used to:
1. Load a specified font
2. Temporarily assign a fallback font and styles to the wrapped component via `props.$fontStyles`
3. When the font is loaded assign the true font to child component via `props.$fontStyles`

```js
const FancyLink1 = withFontLoading('Lato-Bold'.(
  styled('a', props => ({
    ':hover': {fontSize: `${props.answer}px`}.
    ...props.$fontStyles,
  }))
);
```

This will lazy-load `Lato-Bold` and meanwhile assign a fallback font and styling to the element via `props.$fontStyles`.

---

### Utils

#### font-loader.js

Promise used by `with-font-loading.js` HOC to dynamically load specified font; calls `resolve` when load is complete.

Uses `document.fonts.load` where available (chrome and firefox as of 10/17), otherwise uses a polyfill.









