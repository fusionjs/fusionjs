export default function generatePreloadLinks(fontNames, fontDictionary) {
  const links = [];
  Object.keys(fontNames).forEach(fontName => {
    const font = fontDictionary[fontName];
    if (font) {
      links.push(
        `\n<link rel="font" href="/_static/${
          font.urls.woff2
        }" as="font" type="font/woff2" crossorigin>`
      );
    }
  });
  return links.join('\n');
}
