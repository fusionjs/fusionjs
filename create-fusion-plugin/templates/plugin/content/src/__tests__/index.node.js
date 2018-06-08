// @flow
import tape from 'tape-cup';
import React from 'react';

import App, {consumeSanitizedHTML} from 'fusion-core';
import {getService} from 'fusion-test-utils';

import Plugin from '../index.js';

/* Test fixtures */
const appCreator = () => {
  const app = new App('test', el => el);
  return () => app;
};

tape('serialization', async t => {
  const element = React.createElement('div');
  const ctx: any = {element, template: {body: []}, memoized: new Map()};
  const service = getService(appCreator(), Plugin);

  t.plan(3);
  if (!Plugin.middleware) {
    t.end();
    return;
  }

  // $FlowFixMe
  await Plugin.middleware(null, service)(ctx, () => Promise.resolve());

  t.equals(ctx.template.body.length, 1, 'pushes serialization to body');
  t.equals(
    // $FlowFixMe
    consumeSanitizedHTML(ctx.template.body[0]).match('__plugin__value__')[0],
    '__plugin__value__'
  );
  t.equals(consumeSanitizedHTML(ctx.template.body[0]).match('</div>'), null);
  t.end();
});
