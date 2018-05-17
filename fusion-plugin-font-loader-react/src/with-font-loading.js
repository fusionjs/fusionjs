/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import PropTypes from 'prop-types';

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
  return (
    OriginalComponent: React.ComponentType<*>
  ): React.ComponentType<*> => {
    class WithFontLoading extends React.Component<*> {
      props: *;
      context: *;
      state: *;

      constructor(props: any, context: any) {
        super(props, context);
        const {fallbackName, styles} = this.context.getFontDetails(fontName);
        if (fallbackName) {
          // switch to fallback name and apply styles to trigger faux font rendition
          this.state = {$fontStyles: {fontFamily: fallbackName, ...styles}};
        } else {
          // no need to do the fallback dance
          this.state = {$fontStyles: {fontFamily: fontName}};
        }
      }

      componentDidMount() {
        if (this.state.$fontStyles.fontFamily !== fontName) {
          loadFont(`${fontName}`).then(() => {
            // $FlowFixMe
            this.setState({$fontStyles: {fontFamily: fontName}});
          });
        }
      }

      render() {
        return <OriginalComponent {...{...this.state, ...this.props}} />;
      }
    }

    WithFontLoading.contextTypes = {
      getFontDetails: PropTypes.func,
    };
    return WithFontLoading;
  };
};

export default withFontLoading;
