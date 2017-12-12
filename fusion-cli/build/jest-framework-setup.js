/* eslint-env node */
import {configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

// Setup Enzyme for all Jest tests
configure({adapter: new Adapter()});

const testEnv = process.env.ENV || 'browser';
global.__NODE__ = testEnv === 'node';
global.__BROWSER__ = testEnv === 'browser';
