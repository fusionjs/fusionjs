/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type FallbackLookup = {
  [string]: {
    name: string,
    styles: mixed,
  },
};

class PreloadSession {
  fontsToPreload: {[string]: boolean};
  fallbackLookup: FallbackLookup;

  constructor(fallbackLookup: FallbackLookup) {
    // keys are the actual fonts to preload (based on usage on the page), values are always true
    this.fontsToPreload = {};
    this.fallbackLookup = fallbackLookup;
  }

  getFontDetails = (name: string) => {
    const {name: fallbackName, styles = {}} = this.fallbackLookup[name] || {};
    const result = {
      name,
      fallbackName,
      styles,
    };
    if (__NODE__) {
      // preload fallback, or if font has no fallback preload font itself
      this.fontsToPreload[fallbackName || name] = true;
    }
    return result;
  };
}

export default PreloadSession;
