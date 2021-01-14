# fusion-plugin-font-loader-react

[![Build status](https://badge.buildkite.com/7a82192275779f6a8ba81f7d4a1b0d294256838faa1dfdf080.svg?branch=master)](https://buildkite.com/uberopensource/fusionjs)

This plugin generates font faces and optionally improves percieved font load performance on slow networks.

You can use the font loader plugin in one of two ways:

**1) Generate styled font faces (compatible with [BaseWeb](https://baseweb.design/))**

```css
@font-face {
  font-family: 'Lato';
  src: url('/_static/ca614426b50ca7d007056aa00954764b.woff2') format('woff2');
  font-weight: 200;
}
@font-face {
  font-family: 'Lato';
  src: url('/_static/ca104da8af9a2e0771e8fe2b31f8ec1e.woff2') format('woff2');
  font-weight: 700;
}
@font-face {
  font-family: 'Lato';
  src: url('/_static/03b64805a8cd2d53fadc5814445c2fb5.woff2') format('woff2');
  font-weight: 200;
}
```

**2) Generate atomic font faces, which when combined with the included HOC will enable a smoother font loading experience over slow networks**

```css
@font-face {
  font-family: 'Lato-Regular';
  src: url('/_static/ca614426b50ca7d007056aa00954764b.woff2') format('woff2');
}
@font-face {
  font-family: 'Lato-Bold';
  src: url('/_static/ca104da8af9a2e0771e8fe2b31f8ec1e.woff2') format('woff2');
}
@font-face {
  font-family: 'Lato-Thin';
  src: url('/_static/03b64805a8cd2d53fadc5814445c2fb5.woff2') format('woff2');
}
```

## What's in this Package?

1. A [Fusion.js](https://fusionjs.com/) plugin that generates @font-faces and optionally preloads fallback fonts based on your font configuration.

2. A Higher Order Component, `withFontLoading.js` for smooth loading of custom web fonts using Flash of Faux Text. See https://www.zachleat.com/web/comprehensive-webfonts/#critical-foft-preload for more on this.

## Installation

```
yarn add fusion-plugin-font-loader-react
```

## How do I use it?

Register the plugin and pass it a font configuration object.

### Registration

```js
// src/main.js
import App from 'fusion-core';
import FontLoaderReactPlugin, {
  FontLoaderReactConfigToken,
} from 'fusion-plugin-font-loader-react';
import getFontConfig from './config/fonts';

export default () => {
  const app = new App(<div />);
  // ...
  app.register(FontLoaderReactToken, FontLoaderPlugin);
  // pass true for styled fonts, false (or empty) for performance mode
  app.register(FontLoaderReactConfigToken, getFontConfig(true));
  // ...
  return app;
};
```

### Configuration Object

When registering this plugin you should also register `FontLoaderReactConfigToken` with a font configuration object. This is a list of font definitions and other properties. The structure of the configuration object depends on which mode you are using the plugin in. The following sections describe how to structure your font config for each mode.

# Styled Mode

**NOTE:** Use Styled Mode if your app uses [BaseWeb](https://baseweb.design/)

Sometimes it's useful to be able to apply different `font-weight`s or `font-style`s without changing the `font-family` value. For example it's inconvenient to have to switch `font-family` just to increase the font-weight when an element is hovered over. Most likely we just want to do this:

```js
const Li = styled('li', {
  fontFamily: 'Lato',
  fontWeight: 200,
  ':hover': {fontWeight: 700},
  marginRight: '12px',
});
```

## Styled Mode Config

**NOTE:** As of version 2.2.0 it is no longer necessary to include a `withStyleOverloads` property. Fusion will detect when font descriptors are for styled mode. You can also supply both styled and atomic font descriptors in the same config file and Fusion will infer which is which.

To use this plugin in Styled Mode your config object should pass an array of font files by style. This example will generate the @font-face declaration that follows it. (See [type declarations](https://github.com/fusionjs/fusionjs/tree/master/fusion-plugin-font-loader-react/blob/master/src/types.js) for more details on this data structure)

```js
{
  'Lato': [
    {
      urls: {
        woff2: assetUrl('ca614426b50ca7d007056aa00954764b.woff2'),
        woff: assetUrl('ca614426b50ca7d007056aa00954764b.woff2'),
      }
      styles: {
        fontWeight: 400,
      }
    },
    {
      urls: {
        woff2: assetUrl('ca104da8af9a2e0771e8fe2b31f8ec1e.woff2'),
        woff: assetUrl('ca104da8af9a2e0771e8fe2b31f8ec1e.woff2')
      }
      styles: {
        fontWeight: 700,
      }
    },
    {
      urls: {
        woff2: assetUrl('03b64805a8cd2d53fadc5814445c2fb5.woff2'),
        woff: assetUrl('03b64805a8cd2d53fadc5814445c2fb5.woff2')
      }
      styles: {
        fontWeight: 200,
      }
    }
  ]
}
```
```css
@font-face {
  font-family: 'Lato';
  src: url('/_static/ca614426b50ca7d007056aa00954764b.woff2') format('woff2');
  font-weight: 200;
}
@font-face {
  font-family: 'Lato';
  src: url('/_static/ca104da8af9a2e0771e8fe2b31f8ec1e.woff2') format('woff2');
  font-weight: 700;
}
@font-face {
  font-family: 'Lato';
  src: url('/_static/03b64805a8cd2d53fadc5814445c2fb5.woff2') format('woff2');
  font-weight: 200;
}
```

## Styled Mode Config Type

```ts
type ConfigType = {
  withStyleOverloads?: boolean, // deprecated: optionally set to true for styled mode
  fonts: {
    [string]: Array<{
      urls:   {woff?: string, woff2: string},
      styles?: {},
    }>
  },
};
```

**NOTE:** If you only want to generate styled @font-face declarations you can ignore the remainder of this document.

# Performance Mode

By default fonts are lazily loaded. For users on slower networks a lazily loaded font is likely to result in signficant FOUT (flash of unstyled content) or FOIT (flash of invisible content). Preloading all fonts will prevent FOUT and FOIT, but will also compete with the bandwith of other critical resources (e.g. core JavaScript bundles).

This plugin makes it easy to implement [FOFT (flash of faux text)](https://www.zachleat.com/web/foft/) as a font loading strategy. With FOFT, you preload only unstyled fonts while continuing to lazy load styled fonts (bold, italic etc. variants). This takes advantage of browsers' ability to synthesize styled font variants (FOFT) when the unstyled font is already loaded, and reduces visual jarring and browser reflow.

For example, if you're using the `Lato` font family, you can preload `Lato-Regular` and defer loading of `Lato-Bold` since the browser can synthesize faux styles for bold and italic versions of available fonts. However, the faux font synthesis algorithm isn't perfect. Font design is an art, which means that there are artistic and ergonomic differences between a synthesized bold style and a hand-crafted font such as `Lato-Bold`. Ideally we want to use `Lato-Bold` instead of a synthesized bold, but it's acceptable to temporarily show a synthesized bold while waiting for the true `Lato-Bold` font to be downloaded and switching over when the download is done. The (less desirable) alternative would be to either block `DOMContentLoaded` while all `Lato` variations are downloaded, or asynchronously downloading the entire font family, causing a long period of FOUT/FOIT.

## Performance Mode Config

The `fonts` object should contain an property for each font name. Each entry includes a `urls` property (referencing the font file paths) and (optionally) a `fallback` property. Finally you need to specify a `preloadDepth` which tells the font loader how many levels of fallbacks to preload.

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

The generated @font-face for this config should look like this:

```css
@font-face {
  font-family: 'Lato-Regular';
  src: url('/_static/ca614426b50ca7d007056aa00954764b.woff2') format('woff2');
}
@font-face {
  font-family: 'Lato-Bold';
  src: url('/_static/ca104da8af9a2e0771e8fe2b31f8ec1e.woff2') format('woff2');
}
@font-face {
  font-family: 'Lato-Thin';
  src: url('/_static/03b64805a8cd2d53fadc5814445c2fb5.woff2') format('woff2');
}
```

### `fallback` property

The `fallback` property identifies a) the name of the fallback font to use b) the styles to apply to the font while waiting for the true font to load in order to simulate the true font.

### `preload` property

You can tune the balance between performance and user experience by varying the `preloadDepth` configuration value, which lets you specify how many levels of fonts to preload and how many to load asynchronously.

`preloadDepth = 0`: Every font is preloaded, there are no fallback fonts. There is no FOFT or FOUT but there may be some FOIT
Use this when jank-free font loading is more important than page load performance.

`preloadDepth = 1`: Preload roman (non-stylized, e.g. `Lato`) fonts. Stylized fonts (e.g. `Lato-Bold`) will be lazily loaded and will fallback to preloaded font. During fallback period the browser will apply the appropriate style to the roman font which will display a good approximation of the stylized font (FOFT) which is less jarring than falling back to a system font.
Use this when you want to balance performance with font-loading smoothness

`preloadDepth = 2`: Don't preload any fonts. Lazily load all fonts. Lazily loading fonts will immediately fallback to the system font (FOUT).

Use this when page load performance is more important than font-load smoothness


## Performance Mode Config Type

```ts
type ConfigType = {
  preloadDepth?: number, // default 0
  withStyleOverloads?: boolean, // deprecated: defaults to false
  fonts: {
    [string]: {
      urls:   {woff?: string, woff2: string},
      fallback?: {
        name: string,
        styles?: {
          [string]: string,
        },
      },
    }
  },
};
```

## Using useFontLoading Hook

To use the font loader in performance mode you can take davanatge of the `useFontLoading` react hook that comes with this package.

```js
export default function Hello() {
  const fontStyles = useFontLoading('Lato-Bold');
  const [css] = useStyletron();
  const header = css({
    fontWeight: '100',
    fontSize: '96px',
    margin: '0px',
    ...fontStyles,
  });
  return (
    <div>
      <h1 className={header}>Welcome</h1>
    </div>
  );
}
```

## Using withFontLoading HOC

Alternatively you can use an HOC:

```js
import {withFontLoading} from 'fusion-plugin-font-loader-react';
```

```js
const hoc = withFontLoading('Lato-Bold');
const FancyLink1 = hoc(
  styled('a', props => ({
    ':hover': {fontSize: `${props.answer}px`},
    ...props.$fontStyles,
  }))
);
```

This will:

1. Load a specified font
2. Temporarily assign a fallback font and styles to the wrapped component via `props.$fontStyles`
3. When the font is loaded assign the true font to child component via `props.$fontStyles`

## Types for withFontLoading HOC

```flow
const hoc: HOC = withFontLoading((font: string));
```

- `font: string` - The name of the font whose loading should be managed by the plugin
- returns `hoc: Component => Component`

This will work identically to the `withFontLoadingHOC`, including dynamically switching between fallback font and true font based on what is currently loaded.

## How Performance Mode Works

1. An in-memory font fallback tree is generated at runtime based on the defintitions provided in `font-config.js`
2. Fallbacks at and above the specified `preloadDepth` will be preloaded/prefetched on page load
3. Remaining fonts will lazily loaded.

Based on the sample config above (`preloadDepth` is set to 1), the HOC example above would yield the following values for `prop.$fontStyles`:

While loading the true font the font loader will apply the characteristics of the true font to our base font, which will prompt the browser to simulate our true font:

```js
{
  fontFamily: 'Lato-Regular',
  fontWeight: 'bold',
}
```

When the true font is loaded the font loader removes font styles and switches the style object to the true font:

```js
{
  fontFamily: 'Lato-Bold',
}
```

## Mixed Mode Config

As of version 2.2.0 you can mix styled mode and performance mode descriptors in the same config file. Fusion will infer which is which.

