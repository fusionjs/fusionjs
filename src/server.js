/* eslint-env node */
import {renderToString} from 'react-dom/server';

export default el => `<div id='root'>${renderToString(el)}</div>`;
