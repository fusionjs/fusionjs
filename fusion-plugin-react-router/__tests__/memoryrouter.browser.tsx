/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env browser */
import React from "react";
import ReactDOM from "react-dom";

import { MemoryRouter, Routes, Route } from "../src/browser";

test("memory router works in browser", () => {
  const root = document.createElement("div");

  const Hello = () => <div>Test</div>;
  const el = (
    <MemoryRouter initialEntries={["/test"]}>
      <Routes>
        <Route path="/test" element={<Hello />} />
      </Routes>
    </MemoryRouter>
  );
  ReactDOM.render(el, root);
  expect(/Test/.test(root.innerHTML)).toBeTruthy();
});
