// @noflow

import React from 'react';
import {Translate} from 'fusion-plugin-i18n-react';
import ChildComponent from './child-component.js';

export default () => (
  <div>
    <Translate id="with-child-translation" />
    <ChildComponent />
  </div>
);
