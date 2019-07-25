// @noflow

import React, {Component} from 'react';
import {withTranslations} from 'fusion-plugin-i18n-react';

import SplitRouteContent from './split-route-content';

class SplitRoute extends Component<*, *> {
  render() {
    return <SplitRouteContent />;
  }
}

export default withTranslations(['some.translation'])(SplitRoute);
