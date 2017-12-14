export default function generateFallbackMap(fonts, preloadDepth) {
  // map of font name to array of possible fallbacks (name and style offsets) (closest match first)
  const fallbackCandidateLookup = {};
  // keys are fonts that depth strategy suggests we should preload, values are always true
  const preloadableFallbacks = {};
  // keys are font names, values are objects with properties for fallback name and style offsets
  const fallbackLookup = {};

  // FIRST TRAVERSAL: gather set of possible fallbacks per font and
  // the list of all fonts our depth strategy suggests we should preload
  Object.keys(fonts).forEach(fontName => {
    let depth = 0;
    let nextFallback = {name: fontName};
    fallbackCandidateLookup[fontName] = [nextFallback];
    while (preloadDepth > depth++) {
      const nextFont = fonts[nextFallback && nextFallback.name];
      nextFallback = nextFont && nextFont.fallback;
      if (!nextFallback) {
        // possibly reached system font
        return;
      }
      fallbackCandidateLookup[fontName].push(nextFallback);
    }
    preloadableFallbacks[nextFallback.name] = true;
  });
  // SECOND TRAVERSAL: for each font select the closest fallback font that we planned to preloaded
  Object.keys(fonts).forEach(fontName => {
    // if font itself is preloadable then no fallback required
    if (!preloadableFallbacks[fontName]) {
      // otherwise use the first preloadable fallback
      const fallback = fallbackCandidateLookup[fontName].find(
        fallback => preloadableFallbacks[fallback.name]
      );
      fallbackLookup[fontName] = fallback;
    }
  });

  return fallbackLookup;
}
