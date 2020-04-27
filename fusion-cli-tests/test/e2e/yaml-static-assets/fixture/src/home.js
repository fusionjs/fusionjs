// @noflow

import React from "react";
import content1 from "../static/test.yaml";
import content2 from "../static/test.yml";

export default function Home() {
  return <div id="content">{content1.Subject[0].Name}|{content2.Subject[0].Name}</div>;
};
