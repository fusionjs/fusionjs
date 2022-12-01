import React from "react";
import { Route, Routes } from "fusion-plugin-react-router";

import Home from "./pages/home";
import PageNotFound from "./pages/pageNotFound";

const root = (
  <Routes>
    <Route caseSensitive={true} path="/" element={<Home />} />
    <Route caseSensitive={true} path="/redirected" element={<Home />} />
    <Route element={<PageNotFound />} />
  </Routes>
);

export default root;
