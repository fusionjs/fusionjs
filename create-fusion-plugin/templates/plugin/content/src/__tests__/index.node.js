// @flow
import React from 'react';

import App, {consumeSanitizedHTML} from 'fusion-core';
import {getService} from 'fusion-test-utils';

import Plugin from '../index.js';

/* Test fixtures */
const appCreator = () => {
  const app = new App('test', el => el);
  return () => app;
};

test('serialization', async done => {
  const element = React.createElement('div');
  const ctx: any = {element, template: {body: []}, memoized: new Map()};
  const service = getService(appCreator(), Plugin);

  expect.assertions(3);
  if (!Plugin.middleware) {
    done();
    return;
  }

  // $FlowFixMe
  await Plugin.middleware(null, service)(ctx, () => Promise.resolve());

  expect(ctx.template.body.length).toBe(1);
  expect(
    // $FlowFixMe
    consumeSanitizedHTML(ctx.template.body[0]).match('__plugin__value__')[0]
  ).toBe('__plugin__value__');
  expect(consumeSanitizedHTML(ctx.template.body[0]).match('</div>')).toBe(null);
  done();
});
