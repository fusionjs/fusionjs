/* eslint-env browser */

import test from 'tape-cup';
import React from 'react';
import render from '../../server';

test('renders', async t => {
  const rendered = await render(React.createElement('span', null, 'hello'));
  t.ok(/<span/.test(rendered), 'has right tag');
  t.ok(/hello/.test(rendered), 'has right text');
  t.end();
});
