/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import {configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

// Setup Enzyme for all Jest tests
configure({adapter: new Adapter()});
