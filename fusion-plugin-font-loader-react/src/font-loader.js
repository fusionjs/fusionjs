/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * Polyfill loosely based on zenfonts
 * https://github.com/zengabor/zenfonts/
 * Copyright (c) 2015 Gabor Lenard
 */

/* global document */

const testFonts = ['sans-serif', 'serif', 'monospace'];
// TODO(#3): allow override
const testText = 'π+[.—_]imW12/?';
// how long to wait for load before switching style to true font anyway
const timeout = 60000;

export default function(font: string) {
  // $FlowFixMe
  if (__BROWSER__ && document && document.fonts) {
    return document.fonts && typeof document.fonts.load === 'function'
      ? document.fonts.load(`1em ${font}`) // native API requires size
      : loadFontPolyfill(font);
  }
}

function loadFontPolyfill(font) {
  const testDivs = createTestDivs();
  // $FlowFixMe
  testDivs.forEach(div => (div.style.fontFamily = `${font}, ${div.testFont}`));
  const waitUntil = Date.now() + timeout;
  return new Promise(resolve => {
    (function monitorWidth(delay) {
      setTimeout(function() {
        if (Date.now() >= waitUntil || hasFontLoaded(testDivs)) {
          resolve();
          cleanup(testDivs);
        } else {
          monitorWidth(Math.max(delay * 1.5, 500));
        }
      }, delay);
    })(10);
  });
}

function hasFontLoaded(testDivs) {
  // Test whether n elements that were originally diverse system fonts are now all equal widths
  return Boolean(
    testDivs
      .map(div => div.offsetWidth)
      .reduce((width1, width2) => (width1 === width2 ? width1 : NaN))
  );
}

function cleanup(testDivs) {
  testDivs.forEach(div => {
    const p = div.parentNode;
    if (p) {
      p.removeChild(div);
    }
    return true;
  });
}

function createTestDivs() {
  return testFonts.map((testFont, i) => {
    const div = document.createElement('div');
    // $FlowFixMe
    div.testFont = testFont;
    div.style.cssText = `position:absolute;top:-999px;left:${-9999 +
      i * 100}px;visibility:hidden;
  white-space:nowrap;font-size:20em;font-family:${testFont}`;
    div.appendChild(document.createTextNode(testText));
    if (document && document.body) {
      document.body.appendChild(div);
    }
    return div;
  });
}
