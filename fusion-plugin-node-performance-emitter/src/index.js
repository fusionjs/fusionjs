// Main export file
import browser from './browser';
import server from './server';
export default (__BROWSER__ ? browser : server);
