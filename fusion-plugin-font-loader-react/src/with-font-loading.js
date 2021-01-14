/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {useState, useEffect, useRef} from 'react';
import type {ComponentType} from 'react';
import {useService} from 'fusion-react';

import {FontLoaderReactToken} from './tokens';
import loadFont from './font-loader';

/*
Returns a React HOC
1) starts loading real font and passes fallback font and faux styling to wrappedComponent as props.$fontStyles
2) when font load completes passes real font to wrappedComponent as props.$fontStyles

Usage:
withFontLoading(fontName)(wrappedComponent)

fontProps is hash of font property names to required font names
e.g. (with styletron)
withFontLoading('Lato-Bold')(styled('div', props => props.$fontStyles));

All requested fonts should be defined in src/fonts/fontConfig.js
*/

const withFontLoading = (fontName: string) => {
  return (OriginalComponent: ComponentType<*>): ComponentType<*> => {
    return React.forwardRef(FontLoader);

    function FontLoader(props: any, ref: any) {
      const mounted: {current: ?boolean} = useRef(null);
      // $FlowFixMe
      const {getFontDetails} = useService(FontLoaderReactToken);
      if (typeof getFontDetails !== 'function') {
        throw new Error(
          `withFontLoading not supported. This might be because you only have styled fonts (see https://github.com/fusionjs/fusionjs/blob/master/fusion-plugin-font-loader-react/README.md#styled-mode)`
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
          // $FlowFixMe (this can only be browser so will not be undefined)
          loadFont(`${fontName}`).then(() => {
            mounted && setFontStyles({fontFamily: fontName});
          });
        }
        return () => {
          mounted.current = false;
        };
      });

      return (
        <OriginalComponent $fontStyles={fontStyles} {...props} ref={ref} />
      );
    }
  };
};

export default withFontLoading;
