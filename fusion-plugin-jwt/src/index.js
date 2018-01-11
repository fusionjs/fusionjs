// Main export file
import browser from './jwt-browser';
import server from './jwt-server';

export default (__BROWSER__ ? browser : server);
