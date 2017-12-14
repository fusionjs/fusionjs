import tape from 'tape-cup';
import generateFallbackMap from '../generate-fallback-map';
import generateFontFaces from '../generate-font-faces';
import generatePreloadLinks from '../generate-preload-links';
import {fonts} from './fixtures/static/font-config';
import {
  fallbackLookup as expectedFallbackLookup,
  fontFaces as expectedFontFaces,
  preloadLinks as expectedPreloadLinks,
} from './fixtures/expected';

tape('generateFallbackMap', t => {
  t.equal(
    typeof generateFallbackMap,
    'function',
    'exports a generateFallbackMap function'
  );
  t.deepEqual(generateFallbackMap(fonts, 0), expectedFallbackLookup.depth0);
  t.deepEqual(generateFallbackMap(fonts, 1), expectedFallbackLookup.depth1);
  t.deepEqual(generateFallbackMap(fonts, 2), expectedFallbackLookup.depth2);
  t.end();
});

tape('generateFontFaces', t => {
  t.equal(
    typeof generateFontFaces,
    'function',
    'exports a generateFontFaces function'
  );
  t.equal(generateFontFaces(fonts), expectedFontFaces);
  t.end();
});

tape('generatePreloadLinks', t => {
  t.equal(
    typeof generatePreloadLinks,
    'function',
    'exports a generatePreloadLinks function'
  );
  t.equal(
    generatePreloadLinks({'Lato-Regular': true}, fonts),
    expectedPreloadLinks
  );
  t.end();
});
