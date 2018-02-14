export default function generatePreloadLinks(fontNames, fontDictionary) {
  const links = [];
  Object.keys(fontNames).forEach(fontName => {
    const font = fontDictionary[fontName];
    if (font) {
      // we can't detect woff2 support on the server, but in the cases where it's
      // not supported (IE 8, Safari <= El Capitan) this will silently fail and
      // styles will trigger load a little later
      links.push(
        `\n<link rel="preload" href="${
          font.urls.woff2
        }" as="font" type="font/woff2" crossorigin>`
      );
    }
  });
  return links.join('\n');
}
