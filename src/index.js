/* eslint-env browser */
import CoreApp from 'fusion-core';
import {compose} from 'fusion-core';
import {prepare, PreparePlugin} from 'fusion-react-async';
import serverRender from './server';
import clientRender from './client';

import ProviderPlugin from './plugin';
import ProvidedHOC from './hoc';
import Provider from './provider';

export default class App extends CoreApp {
  constructor(root, render) {
    super(root, el => {
      return prepare(el).then(() => {
        if (render) {
          return render(el);
        }
        return __NODE__ ? serverRender(el) : clientRender(el);
      });
    });
    this.plugins.push(compose([PreparePlugin(), this.plugins.pop()]));
  }
}

export {ProviderPlugin, ProvidedHOC, Provider};
