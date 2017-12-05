/* eslint-env node */
import {renderToStringWithData} from 'react-apollo';

export default root => {
  return renderToStringWithData(root).then(content => {
    return `<div id='root'>${content}</div>`;
  });
};
