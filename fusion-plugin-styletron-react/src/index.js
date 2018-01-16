/* eslint-env browser */
import {styled} from 'styletron-react';
import server from './server';
import browser from './browser';

export default (__NODE__ ? server : browser);
export {styled};
