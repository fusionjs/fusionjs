// @noflow

import React from 'react';
import Router, {Route, Routes, Link} from 'fusion-plugin-react-router';
import Home from './home.js';

export default function Root() {
  return (
    <div>
      <Routes>
        <Route path={'/'} element={<Home />} />
      </Routes>
    </div>
  );
}
