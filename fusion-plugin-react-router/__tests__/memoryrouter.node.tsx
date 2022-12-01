/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from "react";

import { renderToString as render } from "react-dom/server";

import { MemoryRouter, Routes, Route } from "../src/server";

test("memory router works in server", () => {
  const Hello = () => <div>Test</div>;
  const el = (
    <MemoryRouter initialEntries={["/test"]}>
      <Routes>
        <Route path="/test" element={<Hello />} />
      </Routes>
    </MemoryRouter>
  );
  expect(/Test/.test(render(el))).toBeTruthy();
});
