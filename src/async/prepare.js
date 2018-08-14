/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import {
  isFragment,
  isContextConsumer,
  isContextProvider,
  isForwardRef,
} from 'react-is';

import isReactCompositeComponent from './utils/isReactCompositeComponent';
import {isPrepared, getPrepare} from './prepared';

function renderCompositeElementInstance(instance) {
  const childContext = Object.assign(
    {},
    instance.context,
    instance.getChildContext ? instance.getChildContext() : {}
  );
  if (instance.componentWillMount) {
    instance.componentWillMount();
  } else if (instance.UNSAFE_componentWillMount) {
    instance.UNSAFE_componentWillMount();
  }
  const children = instance.render();
  return [children, childContext];
}

function prepareComponentInstance(instance) {
  if (!isPrepared(instance)) {
    return Promise.resolve({});
  }
  const prepareConfig = getPrepare(instance);
  // If the component is deferred, skip the prepare step
  if (prepareConfig.defer) {
    return Promise.resolve(prepareConfig);
  }
  // $FlowFixMe
  return prepareConfig.prepare(instance.props, instance.context).then(() => {
    return prepareConfig;
  });
}

function prepareElement(element, context) {
  if (element === null || typeof element !== 'object') {
    return Promise.resolve([null, context]);
  }
  const {type, props} = element;
  if (isContextConsumer(element)) {
    return Promise.resolve([props.children(type._currentValue), context]);
  }
  if (isContextProvider(element)) {
    type._context._currentValue = props.value;
    return Promise.resolve([props.children, context]);
  }
  if (
    typeof type === 'string' ||
    isFragment(element) ||
    isForwardRef(element)
  ) {
    return Promise.resolve([props.children, context]);
  }
  if (!isReactCompositeComponent(type)) {
    return Promise.resolve([type(props, context), context]);
  }
  const CompositeComponent = type;
  const instance = new CompositeComponent(props, context);
  instance.props = props;
  instance.context = context;
  if (instance.componentWillUnmount && __BROWSER__) {
    context.__UNMOUNTS__.push(() => instance.componentWillUnmount());
  }
  return prepareComponentInstance(instance).then(prepareConfig => {
    // Stop traversing if the component is defer or boundary
    if (prepareConfig.defer || prepareConfig.boundary) {
      return Promise.resolve([null, context]);
    }
    return renderCompositeElementInstance(instance);
  });
}

function _prepare(element, context) {
  return prepareElement(element, context).then(([children, childContext]) => {
    return Promise.all(
      React.Children.toArray(children).map(child =>
        _prepare(child, childContext)
      )
    );
  });
}

function prepare(element: any, context: any = {}) {
  context.__IS_PREPARE__ = true;
  context.__UNMOUNTS__ = [];
  return _prepare(element, context).then(() => {
    context.__IS_PREPARE__ = false;
    context.__UNMOUNTS__.forEach(fn => {
      return fn();
    });
  });
}

export default prepare;
