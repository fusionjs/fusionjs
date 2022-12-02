/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable react/no-multi-comp */
import * as React from 'react';
import TestRenderer from 'react-test-renderer';
import {prepare, prepared} from '../src/async/index';

test('Preparing a hook', (done) => {
  function Component() {
    const [state] = React.useState(0);
    return `Current value: ${state}`;
  }
  const app = <Component />;
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    const renderer = TestRenderer.create(app);
    expect(renderer.root.children).toEqual(['Current value: 0']);
    done();
  });
});

test('Preparing a sync app', (done) => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  class SimpleComponent extends React.Component<any> {
    constructor(props, context) {
      super(props, context);
      numConstructors++;
    }
    render() {
      numRenders++;
      return <SimplePresentational />;
    }
  }
  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const app = <SimpleComponent />;
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    expect(numConstructors).toBe(1);
    expect(numRenders).toBe(1);
    expect(numChildRenders).toBe(1);
    done();
  });
});

test('Preparing a sync app with nested children', (done) => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  class SimpleComponent extends React.Component<any> {
    constructor(props, context) {
      super(props, context);
      numConstructors++;
    }
    render() {
      numRenders++;
      return <div>{this.props.children}</div>;
    }
  }
  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const app = (
    <SimpleComponent>
      <SimplePresentational />;
    </SimpleComponent>
  );
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    expect(numConstructors).toBe(1);
    expect(numRenders).toBe(1);
    expect(numChildRenders).toBe(1);
    done();
  });
});

test('Preparing a sync app with functional components referencing children', (done) => {
  let numRenders = 0;
  let numChildRenders = 0;
  let numPrepares = 0;
  function SimpleComponent(props, context) {
    numRenders++;
    return <div>{props.children}</div>;
  }
  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const AsyncChild = prepared((props) => {
    numPrepares++;
    expect(props.data).toBe('test');
    return Promise.resolve();
  })(SimplePresentational);
  const app = (
    <SimpleComponent>
      <AsyncChild data="test" />
    </SimpleComponent>
  );
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    expect(numRenders).toBe(2);
    expect(numPrepares).toBe(1);
    expect(numChildRenders).toBe(1);
    done();
  });
});

test('Preparing an async app', (done) => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  let numPrepares = 0;
  class SimpleComponent extends React.Component<any> {
    constructor(props, context) {
      super(props, context);
      numConstructors++;
    }
    render() {
      numRenders++;
      return <SimplePresentational />;
    }
  }
  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const AsyncParent = prepared((props) => {
    numPrepares++;
    expect(props.data).toBe('test');
    return Promise.resolve();
  })(SimpleComponent);
  const app = <AsyncParent data="test" />;
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    expect(numPrepares).toBe(1);
    expect(numConstructors).toBe(1);
    expect(numRenders).toBe(1);
    expect(numChildRenders).toBe(1);
    done();
  });
});

test('Preparing an async app with nested asyncs', (done) => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  let numPrepares = 0;
  class SimpleComponent extends React.Component<any> {
    constructor(props, context) {
      super(props, context);
      numConstructors++;
    }
    render() {
      numRenders++;
      return <div>{this.props.children}</div>;
    }
  }

  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const AsyncParent = prepared((props) => {
    numPrepares++;
    expect(props.data).toBe('test');
    return Promise.resolve();
  })(SimpleComponent);
  const app = (
    <AsyncParent effectId="1" data="test">
      <AsyncParent effectId="2" data="test">
        <SimplePresentational />
      </AsyncParent>
    </AsyncParent>
  );

  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    expect(numPrepares).toBe(2);
    expect(numConstructors).toBe(3);
    expect(numRenders).toBe(3);
    expect(numChildRenders).toBe(1);
    done();
  });
});

test('Preparing an app with sibling async components', (done) => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  let numPrepares = 0;
  class SimpleComponent extends React.Component<any> {
    constructor(props, context) {
      super(props, context);
      numConstructors++;
    }
    render() {
      numRenders++;
      return <div>{this.props.children}</div>;
    }
  }

  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const AsyncParent = prepared(async (props) => {
    numPrepares++;
    expect(props.data).toBe('test');
  })(SimpleComponent);
  const app = (
    <div>
      <AsyncParent effectId="1" data="test">
        <SimplePresentational />
      </AsyncParent>
      <AsyncParent effectId="2" data="test">
        <SimplePresentational />
      </AsyncParent>
    </div>
  );

  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    expect(numPrepares).toBe(2);
    expect(numConstructors).toBe(2);
    expect(numRenders).toBe(2);
    expect(numChildRenders).toBe(2);
    done();
  });
});

test('Rendering a component triggers componentWillMount before render', (done) => {
  const orderedMethodCalls = [];
  const orderedChildMethodCalls = [];

  // Disable eslint for deprecated componentWillMount
  // eslint-disable-next-line react/no-deprecated
  class SimpleComponent extends React.Component<any> {
    UNSAFE_componentWillMount() {
      orderedMethodCalls.push('componentWillMount');
    }

    render() {
      orderedMethodCalls.push('render');
      return <SimpleChildComponent />;
    }
  }

  // Disable eslint for deprecated componentWillMount
  // eslint-disable-next-line react/no-deprecated
  class SimpleChildComponent extends React.Component<any> {
    UNSAFE_componentWillMount() {
      orderedChildMethodCalls.push('componentWillMount');
    }

    render() {
      orderedChildMethodCalls.push('render');
      return <div>Hello World</div>;
    }
  }

  const app = <SimpleComponent />;
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    expect(orderedMethodCalls).toEqual(['componentWillMount', 'render']);
    expect(orderedChildMethodCalls).toEqual(['componentWillMount', 'render']);
    done();
  });
});

test('Preparing an async app with componentWillReceiveProps option', (done) => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  let numPrepares = 0;
  class SimpleComponent extends React.Component<any> {
    constructor(props, context) {
      super(props, context);
      numConstructors++;
    }
    render() {
      numRenders++;
      return <SimplePresentational />;
    }
  }
  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const AsyncParent = prepared(
    (props) => {
      numPrepares++;
      expect(props.data).toBe('test');
      return Promise.resolve();
    },
    {
      componentWillReceiveProps: true,
    }
  )(SimpleComponent);
  const app = <AsyncParent data="test" />;
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    expect(numPrepares).toBe(1);
    expect(numConstructors).toBe(1);
    expect(numRenders).toBe(1);
    expect(numChildRenders).toBe(1);
    // triggers componentDidMount
    const renderer = TestRenderer.create(app);
    expect(numPrepares).toBe(2);
    // triggers componentWillReceiveProps
    renderer.update(<AsyncParent data="test" test />);
    expect(numPrepares).toBe(3);
    done();
  });
});

test('Preparing an async app with componentDidUpdate option', (done) => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  let numPrepares = 0;
  class SimpleComponent extends React.Component<any> {
    constructor(props, context) {
      super(props, context);
      numConstructors++;
    }
    render() {
      numRenders++;
      return <SimplePresentational />;
    }
  }
  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const AsyncParent = prepared(
    (props) => {
      numPrepares++;
      expect(props.data).toBe('test');
      return Promise.resolve();
    },
    {
      componentDidUpdate: true,
    }
  )(SimpleComponent);
  const app = <AsyncParent data="test" />;
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    expect(numPrepares).toBe(1);
    expect(numConstructors).toBe(1);
    expect(numRenders).toBe(1);
    expect(numChildRenders).toBe(1);
    // triggers componentDidMount
    const renderer = TestRenderer.create(app);
    expect(numPrepares).toBe(2);
    // triggers componentDidUpdate
    renderer.update(<AsyncParent data="test" test />);
    expect(numPrepares).toBe(3);
    done();
  });
});

test('Preparing React.forwardRef', (done) => {
  // $FlowFixMe
  const Forwarded = React.forwardRef(function Inner(props, ref) {
    // eslint-disable-line
    return <div ref={ref}>{props.children}</div>;
  });

  const app = (
    <Forwarded>
      <span>1</span>
      <span>2</span>
    </Forwarded>
  );
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    const renderer = TestRenderer.create(<div>{app}</div>);
    expect(renderer.root.findAllByType('span').length).toBe(2);
    done();
  });
});

test('Preparing React.forwardRef with async children', (done) => {
  // $FlowFixMe
  const Forwarded = React.forwardRef(function Inner(props, ref) {
    // eslint-disable-line
    return <div ref={ref}>{props.children}</div>;
  });
  let numChildRenders = 0;
  let numPrepares = 0;
  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const AsyncChild = prepared((props) => {
    numPrepares++;
    expect(props.data).toBe('test');
    return Promise.resolve();
  })(SimplePresentational);
  const app = (
    <Forwarded>
      <AsyncChild effectId="1" data="test" />
      <AsyncChild effectId="2" data="test" />
    </Forwarded>
  );
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    expect(numPrepares).toBe(2);
    expect(numChildRenders).toBe(2);
    done();
  });
});

test('Preparing a Fragment', (done) => {
  const app = (
    <React.Fragment>
      <span>1</span>
      <span>2</span>
    </React.Fragment>
  );
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    const renderer = TestRenderer.create(<div>{app}</div>);
    expect(renderer.root.findAllByType('span').length).toBe(2);
    done();
  });
});

test('Preparing a fragment with async children', (done) => {
  let numChildRenders = 0;
  let numPrepares = 0;
  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const AsyncChild = prepared((props) => {
    numPrepares++;
    expect(props.data).toBe('test');
    return Promise.resolve();
  })(SimplePresentational);
  const app = (
    // $FlowFixMe
    <React.Fragment>
      <AsyncChild effectId="1" data="test" />
      <AsyncChild effectId="2" data="test" />
    </React.Fragment>
  );
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    expect(numPrepares).toBe(2);
    expect(numChildRenders).toBe(2);
    done();
  });
});

test('Preparing React.createContext()', (done) => {
  // $FlowFixMe
  const {Provider, Consumer} = React.createContext('light');

  const app = (
    <Provider value="light">
      <span>1</span>
      <Consumer>{() => <span>2</span>}</Consumer>
    </Provider>
  );
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    const renderer = TestRenderer.create(<div>{app}</div>);
    expect(renderer.root.findAllByType('span').length).toBe(2);
    done();
  });
});

test('Preparing React.createContext() with async children', (done) => {
  // $FlowFixMe
  const {Provider, Consumer} = React.createContext('light');

  let numChildRenders = 0;
  let numPrepares = 0;
  let numRenderPropsRenders = 0;
  function SimplePresentational() {
    numChildRenders++;

    return (
      <Consumer>
        {(theme) => {
          numRenderPropsRenders++;
          expect(theme).toBe('dark');
          return <div>{theme}</div>;
        }}
      </Consumer>
    );
  }

  const AsyncChild = prepared((props) => {
    numPrepares++;
    expect(props.data).toBe('test');
    return Promise.resolve();
  })(SimplePresentational);

  const app = (
    <Provider value="dark">
      <AsyncChild effectId="1" data="test" />
      <AsyncChild effectId="2" data="test" />
    </Provider>
  );
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    expect(numPrepares).toBe(2);
    expect(numRenderPropsRenders).toBe(2);
    expect(numChildRenders).toBe(2);

    const renderer = TestRenderer.create(<div>{app}</div>);
    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        <div>
          dark
        </div>
        <div>
          dark
        </div>
      </div>
    `);
    done();
  });
});

test('Preparing React.createContext() with deep async children', (done) => {
  // $FlowFixMe
  const {Provider, Consumer} = React.createContext('light');

  let numChildRenders = 0;
  let numPrepares = 0;
  let numRenderPropsRenders = 0;
  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }

  const AsyncChild = prepared((props) => {
    numPrepares++;
    expect(props.data).toBe('test');
    return Promise.resolve();
  })(SimplePresentational);

  const ConsumerComponent = () => {
    return (
      <Consumer>
        {(theme) => {
          numRenderPropsRenders++;
          expect(theme).toBe('dark');
          return <AsyncChild data="test" />;
        }}
      </Consumer>
    );
  };

  const app = (
    <Provider value="dark">
      <ConsumerComponent />
    </Provider>
  );
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    expect(numPrepares).toBe(1);
    expect(numChildRenders).toBe(1);
    expect(numRenderPropsRenders > 0).toBeTruthy();
    done();
  });
});

test('Preparing React.createContext() using the default provider value', (done) => {
  // $FlowFixMe
  const {Consumer} = React.createContext('light');

  let numChildRenders = 0;
  let numPrepares = 0;
  let numRenderPropsRenders = 0;
  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }

  const AsyncChild = prepared((props) => {
    numPrepares++;
    expect(props.data).toBe('test');
    return Promise.resolve();
  })(SimplePresentational);

  const ConsumerComponent = () => {
    return (
      <Consumer>
        {(theme) => {
          numRenderPropsRenders++;
          expect(theme).toBe('light');
          return <AsyncChild data="test" />;
        }}
      </Consumer>
    );
  };

  const app = <ConsumerComponent />;
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    expect(numPrepares).toBe(1);
    expect(numChildRenders).toBe(1);
    expect(numRenderPropsRenders > 0).toBeTruthy();
    done();
  });
});

test('Preparing a component using getDerivedStateFromProps', (done) => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  let numPrepares = 0;
  let numDerivedStateFromProps = 0;
  let retainedState = false;
  class SimpleComponent extends React.Component<any, any> {
    constructor(props, context) {
      super(props, context);
      numConstructors++;
      this.state = {
        firstRender: true,
        originalState: 'should remain',
      };
    }

    static getDerivedStateFromProps(props, {firstRender}) {
      numDerivedStateFromProps++;
      return {
        firstRender: false,
        someNewKey: [1, 2, 3],
      };
    }
    // eslint-disable-next-line react/no-deprecated
    componentWillMount() {
      throw new Error('Should not be called when gDSFP is defined');
    }

    render() {
      numRenders++;
      retainedState = this.state.originalState === 'should remain';
      return (
        <div>
          {this.state.someNewKey.map((item, key) => (
            <div key={key} />
          ))}
          <SimplePresentational />
        </div>
      );
    }
  }
  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const AsyncParent = prepared(
    (props) => {
      numPrepares++;
      expect(props.data).toBe('test');
      return Promise.resolve();
    },
    {
      componentDidMount: false,
      componentDidUpdate: false,
    }
  )(SimpleComponent);
  const app = <AsyncParent data="test" />;
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    expect(retainedState).toBe(true);
    expect(numPrepares).toBe(1);
    expect(numConstructors).toBe(1);
    expect(numRenders).toBe(1);
    expect(numChildRenders).toBe(1);
    expect(numDerivedStateFromProps).toBe(1);
    // triggers getDerivedStateFromProps
    const renderer = TestRenderer.create(app);
    expect(numDerivedStateFromProps).toBe(2);
    // triggers getDerivedStateFromProps
    renderer.update(<AsyncParent data="test" test />);
    expect(numDerivedStateFromProps).toBe(3);
    done();
  });
});
