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
    return function WithFontLoading(props: any) {
      const mounted: {current: ?boolean} = useRef(null);
      const {getFontDetails} = useService(FontLoaderReactToken);
      if (typeof getFontDetails !== 'function') {
        throw new Error(
          `withFontLoading not supported. This might be because you set \`withStyleOverloads\`
to true in the font loader config`
        );
      }
      const {fallbackName, styles} = getFontDetails(fontName);
      const [fontStyles, setFontStyles] = useState([]);
      if (fallbackName) {
        // switch to fallback name and apply styles to trigger faux font rendition
        setFontStyles({fontFamily: fallbackName, ...styles});
      } else {
        // no need to do the fallback dance
        setFontStyles({$fontStyles: {fontFamily: fontName}});
      }

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

      return <OriginalComponent {...{...this.state, ...this.props}} />;
    };
  };
};

export default withFontLoading;
