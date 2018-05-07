/* eslint-env node */
import {configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-15';

// Setup Enzyme for all Jest tests
configure({adapter: new Adapter()});
