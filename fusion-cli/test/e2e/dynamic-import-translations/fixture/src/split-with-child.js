// @noflow

import React, {Component} from 'react';
import {withTranslations} from 'fusion-plugin-i18n-react';

import SplitRouteChild from './split-child.js';

function SplitRouteWithChild () {
  return <SplitRouteChild />;
}

export default withTranslations(['__SPLIT_WITH_CHILD__'])(SplitRouteWithChild);
