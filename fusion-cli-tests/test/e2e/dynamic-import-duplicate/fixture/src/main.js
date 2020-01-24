// @noflow
import React from 'react';
import App, {split} from 'fusion-react';
import {RenderToken} from 'fusion-core';

const LoadingComponent = () => 'loading';
const ErrorComponent = () => 'error';

const One = split({
  load: () => import('./one/index.js'),
  LoadingComponent,
  ErrorComponent,
});

const OneDuplicate = split({
  load: () => import('./one/index.js'),
  LoadingComponent,
  ErrorComponent,
});

const Two = split({
  load: () => import('./two/index.js'),
  LoadingComponent,
  ErrorComponent,
});

export default function() {
  const app = new App((
    <div>
      <span>
        <One/>
      </span>
      <span>
        <OneDuplicate/>
      </span>
      <span>
        <Two/>
      </span>
    </div>
  ));
  if (__NODE__) {
    app.register(RenderToken, () => {
      return '<div id="root"></div>';
    });
  }
  return app;
}
