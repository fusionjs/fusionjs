// @noflow

import React from 'react';
import {Translate} from 'fusion-plugin-i18n-react';
import OtherComponent from './other-component.js';

export default () => (
  <div id="split1-translation">
    <OtherComponent />
    <Translate id="split1" />
  </div>
);
