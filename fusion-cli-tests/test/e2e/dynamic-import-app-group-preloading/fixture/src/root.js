// @noflow

import React from 'react';
import Router, {Route, Routes, Link} from 'fusion-plugin-react-router';
import {split} from 'fusion-react';

const LoadingComponent = () => <div />;
const ErrorComponent = () => <div />;

const A = split({
  load() {
    return import('./split-a');
  },
  LoadingComponent,
  ErrorComponent,
});

const B = split({
  load() {
    return import('./split-b');
  },
  LoadingComponent,
  ErrorComponent,
});

export default function Root() {
  return (
    <div>
      <Routes>
        <Route caseSensitive={true} path={'/split-a'} element={<A />} />
        <Route caseSensitive={true} path={'/split-b'} element={<A />} />
      </Routes>
    </div>
  );
}
