/* eslint-env browser */
import server from './server';
import browser from './browser';
import {styled} from 'styletron-react';

export default (__NODE__ ? server : browser);
export {styled};
