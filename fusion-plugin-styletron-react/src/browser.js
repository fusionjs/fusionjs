/* eslint-env browser */
import React from 'react';
import Styletron from 'styletron-client';
import {StyletronProvider} from 'styletron-react';

export default () => (ctx, next) => {
  if (ctx.element) {
    const styleElements = document.getElementsByClassName(
      '_styletron_hydrate_'
    );
    const styletron = new Styletron(styleElements);

    ctx.element = (
      <StyletronProvider styletron={styletron}>{ctx.element}</StyletronProvider>
    );
  }

  next();
};
