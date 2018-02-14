export default function generateFontFaces(fontDictionary) {
  const faces = [];
  Object.keys(fontDictionary).forEach(fontName => {
    const font = fontDictionary[fontName];
    if (font) {
      faces.push(
        `@font-face {font-family: "${fontName}"; src: ${asFontFaceSrc(
          font.urls
        )};}`
      );
    }
  });
  return '\n' + faces.join('\n');
}

function asFontFaceSrc(urls) {
  // `urls` is a dictionary of font types (woff, woff2 etc) to url string
  return Object.keys(urls).map(
    type => `url("${urls[type]}") format("${type}")\n`
  );
}
