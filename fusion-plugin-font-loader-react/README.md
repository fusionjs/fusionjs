# fusion-plugin-font-loader-react

[![Build status](https://badge.buildkite.com/a09fc8cc2c13e72534ae4e791fb891753489fb80e02d82021b.svg?branch=master)](https://buildkite.com/uberopensource/fusion-plugin-font-loader-react)

This plugin makes it easy to implement [FOFT (flash of faux text)](https://www.zachleat.com/web/foft/) as a font loading strategy, as opposed to the less desirable FOUT (flash of unstyled text) and FOIT (flash of invisible text). With FOFT, you can load critical fonts faster and minimize the amount of reflow for bold/italic font variations, by letting the browser synthesize faux variants and switching to real bold/italic fonts after they are asynchronously downloaded.

For example, if you're using the `Lato` font family, you can defer loading of `Lato-Bold` since the browser can synthesize faux styles for bold and italics for any font by using a generic algorithm. However, the faux font synthesis algorithm isn't perfect. Font design is an art, which means that there are artistic and ergonomic differences between a synthesized bold style and a hand-crafted font such as `Lato-Bold`. Ideally we want to use `Lato-Bold` instead of a synthesized bold, but it's acceptable to temporarily show a synthesized bold while waiting for the true `Lato-Bold` font to be downloaded and switching over when the download is done. The (less desirable) alternative would be to either block `DOMContentLoaded` while all `Lato` variations are downloaded, or asynchronously downloading the entire font family, causing a long period of FOUT/FOIT.

You can tune the balance between performance and user experience with simple configurations. This plugin generates inline @font-face CSS declarations and preloads fallback fonts based on a `preloadDepth` configuration vlue, which lets you specify how many fonts to preload and how many to load asynchronously.

This package provides:
1. A fusion plugin that generates @font-faces and preloads fallback fonts based on app-level font configuration.
2. A Higher Order Component for loading custom web fonts (and associated utils). During font loading, this HOC temporarily swaps the element to a well-matched fallback font, avoiding FOIT and FOUT. See https://www.zachleat.com/web/comprehensive-webfonts/#critical-foft-preload for more on this.

---

### Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [Setup](#setup)
- [API](#api)

---

### Installation

```
yarn add fusion-plugin-font-loading
```

---

### Usage

#### Configuration
Consuming apps should define a `font-config.js` which a) provides data for @font-face generation, b) is used to derive the fallback font and styles that will be used by the `with-font-loading.js` HOC.

```js
// src/font-config.js
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

The `preloadDepth: 1` configuration above is usually good for most applications, but there may be reasons to tune it differently. If, for example, we were working on an landing page that heavily used `Lato-Bold` above the fold, the FOFT might be more jarring than preloading `Lato-Bold`. In that case, we could change `preloadDepth` to `0` to force `Lato-Bold` to be preloaded via inline CSS.

On the other hand, if there's a major concern about overall performance of a web application, it might be an acceptable trade-off to preload no fonts. In that case, changing `preloadDepth` to `2` would force both `Lato-Regular` and `Lato-Bold` to be loaded asynchronously. This would mean that the page would render immediately using `Helvetica` and later would switch to `Lato-Regular` and `Lato-Bold` as these fonts finished downloading (causing a FOUT).

---

### Setup

```js
// src/main.js
import App from 'fusion-core';
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

const FancyLink1 = withFontLoading('Lato-Bold')(
  styled('a', props => ({
    ':hover': {fontSize: `${props.answer}px`},
    ...props.$fontStyles,
  }))
);
```

---

#### Higher Order Component

```js
import {withFontLoading} from 'fusion-plugin-font-loader-react';
```

This repo also supplies a `with-font-loading.js` Higher Order Component which is used to:
1. Load a specified font
2. Temporarily assign a fallback font and styles to the wrapped component via `props.$fontStyles`
3. When the font is loaded assign the true font to child component via `props.$fontStyles`

```js
const hoc = withFontLoading('Lato-Bold');
const FancyLink1 = hoc(
  styled('a', props => ({
    ':hover': {fontSize: `${props.answer}px`},
    ...props.$fontStyles,
  }))
);
```

This will lazy-load `Lato-Bold` and meanwhile assign a fallback font and styling to the element via `props.$fontStyles`.

```flow
const hoc:HOC = withFontLoading(font: string)
```

* `font: string` - The name of the font whose loading should be managed by the plugin
* returns `hoc: Component => Component`

---

### Utils

#### font-loader.js

Promise used by `with-font-loading.js` HOC to dynamically load specified font; calls `resolve` when load is complete.

Uses `document.fonts.load` where available (chrome and firefox as of 10/17), otherwise uses a polyfill.









