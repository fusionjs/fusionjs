export default function generatePreloadLinks(fontNames, fontDictionary) {
  const links = [];
  Object.keys(fontNames).forEach(fontName => {
    const font = fontDictionary[fontName];
    if (font) {
      // We can't detect woff2 support on the server, but rel=prelaod
      // is only supported by browsers that support woff2.
      // Others will fail silently and pick up the font a little later
      // via the style
      links.push(
        `\n<link rel="preload" href="${
          font.urls.woff2
        }" as="font" type="font/woff2" crossorigin>`
      );
    }
  });
  return links.join('\n');
}
