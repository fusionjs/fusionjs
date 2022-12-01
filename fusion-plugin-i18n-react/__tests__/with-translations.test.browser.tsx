import React from "react";
import { render } from "@testing-library/react";

import { withTranslations } from "../src/index";
import { I18nContext } from "../src/plugin";

test("withTranslations() HOC - localeCode", () => {
  const Foo = withTranslations([])(({ localeCode, translate }) => {
    return (
      <div>
        {localeCode}
        {translate()}
      </div>
    );
  });

  const mockI18n = {
    async load() {},
    localeCode: "fr_CA",
    translate() {
      return "foo bar baz";
    },
  };

  const { asFragment } = render(
    <I18nContext.Provider value={mockI18n}>
      <Foo />
    </I18nContext.Provider>
  );

  expect(asFragment()).toMatchSnapshot();
});
