// @noflow

import React from 'react';
import {Translate} from 'fusion-plugin-i18n-react';

export default () => (
  <div id="other-component">
    <Translate id="other-component-key" />
    <Translate id="other-component-missing-key" />
  </div>
);
