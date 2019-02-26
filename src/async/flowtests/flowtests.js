// @flow

import * as React from 'react';

import {prepared} from '../index.js';

function StrictProps(props: {|foo: 'foo'|}) {
  return <div>Hello World</div>;
}
const PreparedComponent = prepared(async () => {})(StrictProps);

<PreparedComponent foo="foo" />;

// effectId should work with strict object props
<PreparedComponent effectId="1" foo="foo" />;
