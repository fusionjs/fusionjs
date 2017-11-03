/* eslint-env browser */

import test from 'tape-cup';
import React from 'react';
import render from '../../client';

test('renders', t => {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
  render(React.createElement('span', null, 'hello'));
  t.equals(root.firstChild.nodeName, 'SPAN', 'has right tag');
  t.equals(root.firstChild.textContent, 'hello', 'has right text');
  document.body.removeChild(root);
  t.end();
});
