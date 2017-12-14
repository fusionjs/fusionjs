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

export default function(font) {
  if (__BROWSER__) {
    return document.fonts
      ? document.fonts.load(`1em ${font}`) // native API requires size
      : loadFontPolyfill(font);
  }
}

function loadFontPolyfill(font) {
  const testDivs = createTestDivs();
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
    div.testFont = testFont;
    div.style.cssText = `position:absolute;top:-999px;left:${-9999 +
      i * 100}px;visibility:hidden;
  white-space:nowrap;font-size:20em;font-family:${testFont}`;
    div.appendChild(document.createTextNode(testText));
    document.body.appendChild(div);
    return div;
  });
}
