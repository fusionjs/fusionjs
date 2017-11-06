// MIT License

// Copyright (c) 2017 Uber Technologies, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import React from 'react';
import PropTypes from 'prop-types';
import {Route as ReactRouterRoute} from 'react-router-dom';
function Route(props, context) {
  const {trackingId, component, children, ...remainingProps} = props;
  if (remainingProps.render) {
    throw new Error('Cannot pass render function to tracking route');
  }
  const {__IS_PREPARE__} = context;
  if (__IS_PREPARE__) {
    // In this case, it is actually more clear to pass children as a prop
    /* eslint-disable react/no-children-prop */
    return (
      <ReactRouterRoute
        {...remainingProps}
        component={component}
        children={children}
      />
    );
    /* eslint-enable react/no-children-prop */
  }
  const pageData = context.pageData;
  return (
    <ReactRouterRoute
      {...remainingProps}
      render={renderProps => {
        const {match} = renderProps;
        const matchSpecificity = match.path === '/'
          ? 1
          : match.path.split('/').length;
        if (
          !pageData.matchSpecificity ||
          pageData.matchSpecificity < matchSpecificity
        ) {
          Object.assign(pageData, {
            matchSpecificity,
            page: match.path,
            title: trackingId || match.path,
          });
        }
        return component
          ? React.createElement(component, renderProps)
          : React.Children.only(children);
      }}
    />
  );
}

Route.contextTypes = {
  __IS_PREPARE__: PropTypes.bool,
  pageData: PropTypes.object.isRequired,
  getPageData: PropTypes.func,
};

export {Route};
