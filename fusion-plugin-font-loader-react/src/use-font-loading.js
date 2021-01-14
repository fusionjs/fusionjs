/** Copyright (c) 2019 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {useState, useEffect, useRef} from 'react';
import {useService} from 'fusion-react';

import {FontLoaderReactToken} from './tokens';
import loadFont from './font-loader';

function useFontLoading(fontName: string) {
  const mounted = useRef<?boolean>(null);
  const getFontDetails = useService(FontLoaderReactToken);
  if (typeof getFontDetails !== 'function') {
    throw new Error(
      `useFontLoading not supported. This might be because you set \`withStyleOverloads\`
    to true in the font loader config`
    );
  }
  const {fallbackName, styles} = getFontDetails(fontName);
  const initialFontStyles = fallbackName
    ? // switch to fallback name and apply styles to trigger faux font rendition
      {fontFamily: fallbackName, ...styles}
    : // no fallback so just apply true font
      {fontFamily: fontName};

  const [fontStyles, setFontStyles] = useState(initialFontStyles);

  useEffect(() => {
    mounted.current = true;
    if (fontStyles.fontFamily !== fontName) {
      // Promise.resolve() case is for hypothetcial server call (to keep flow happy)
      (loadFont(fontName) || Promise.resolve()).then(() => {
        mounted && setFontStyles({fontFamily: fontName});
      });
    }
    return () => {
      mounted.current = false;
    };
  });

  return fontStyles;
}

export default useFontLoading;
