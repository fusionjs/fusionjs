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
  isPortal,
} from 'react-is';

import isReactCompositeComponent from './utils/isReactCompositeComponent';
import isReactFunctionalComponent from './utils/isReactFunctionalComponent';
import {isPrepared, getPrepare} from './prepared';

function renderCompositeElementInstance(instance) {
  const childContext = Object.assign(
    {},
    instance.context,
    instance.getChildContext ? instance.getChildContext() : {}
  );

  if (instance.constructor && instance.constructor.getDerivedStateFromProps) {
    instance.state = {
      ...instance.state,
      ...instance.constructor.getDerivedStateFromProps(
        instance.props,
        instance.state
      ),
    };
  } else {
    // see https://github.com/reactjs/react-lifecycles-compat/blob/0a02b805fcf119128d1a9244e71ea7077e2cdcc0/index.js#L114
    if (instance.componentWillMount) {
      instance.componentWillMount();
    } else if (instance.UNSAFE_componentWillMount) {
      instance.UNSAFE_componentWillMount();
    }
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
  } else if (isReactFunctionalComponent(type)) {
    return Promise.resolve([type(props, context), context]);
  } else if (isReactCompositeComponent(type)) {
    const CompositeComponent = type;
    const instance = new CompositeComponent(props, context);
    instance.props = props;
    instance.context = context;
    return prepareComponentInstance(instance).then(prepareConfig => {
      // Stop traversing if the component is defer or boundary
      if (prepareConfig.defer || prepareConfig.boundary) {
        return Promise.resolve([null, context]);
      }
      return renderCompositeElementInstance(instance);
    });
  } else if (isPortal(element)) {
    return Promise.resolve([element.children, context]);
  } else {
    throw new TypeError(
      `Invalid React element type. Must be a string, a function or a subclass of React.Component. ` +
        `This error happens if you write a React Component <Foo> where Foo is undefined. ` +
        `This can happen when mistakenly using a default import instead of a named import or vice-versa, ` +
        `or if you are missing a peerDependency in your package.json and your package manager hoists an older version from an unrelated dependency \n\n` +
        JSON.stringify(element, null, 2)
    );
  }
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
  return _prepare(element, context).then(() => {
    context.__IS_PREPARE__ = false;
  });
}

export default prepare;
