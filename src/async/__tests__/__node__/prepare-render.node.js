/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable react/no-multi-comp */
import tape from 'tape-cup';
import React, {Component} from 'react';
import Enzyme, {shallow} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import {prepare, prepared} from '../../index.js';

Enzyme.configure({adapter: new Adapter()});

tape('Preparing a sync app', t => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  class SimpleComponent extends Component<any> {
    constructor(props, context) {
      super(props, context);
      t.equal(
        context.__IS_PREPARE__,
        true,
        'sets __IS_PREPARE__ to true in context'
      );
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
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numConstructors, 1, 'constructs SimpleComponent once');
    t.equal(numRenders, 1, 'renders SimpleComponent once');
    t.equal(numChildRenders, 1, 'renders SimplePresentational once');
    t.end();
  });
});

tape('Preparing a sync app with nested children', t => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  class SimpleComponent extends Component<any> {
    constructor(props, context) {
      super(props, context);
      t.equal(
        context.__IS_PREPARE__,
        true,
        'sets __IS_PREPARE__ to true in context'
      );
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
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numConstructors, 1, 'constructs SimpleComponent once');
    t.equal(numRenders, 1, 'renders SimpleComponent once');
    t.equal(numChildRenders, 1, 'renders SimplePresentational once');
    t.end();
  });
});

tape(
  'Preparing a sync app with functional components referencing children',
  t => {
    let numRenders = 0;
    let numChildRenders = 0;
    let numPrepares = 0;
    function SimpleComponent(props, context) {
      t.equal(
        context.__IS_PREPARE__,
        true,
        'sets __IS_PREPARE__ to true in context'
      );
      numRenders++;
      return <div>{props.children}</div>;
    }
    function SimplePresentational() {
      numChildRenders++;
      return <div>Hello World</div>;
    }
    const AsyncChild = prepared(props => {
      numPrepares++;
      t.equal(
        props.data,
        'test',
        'passes props through to prepared component correctly'
      );
      return Promise.resolve();
    })(SimplePresentational);
    const app = (
      <SimpleComponent>
        <AsyncChild data="test" />
      </SimpleComponent>
    );
    const p = prepare(app);
    t.ok(p instanceof Promise, 'prepare returns a promise');
    p.then(() => {
      t.equal(numRenders, 1, 'renders SimpleComponent once');
      t.equal(numPrepares, 1, 'runs prepare function once');
      t.equal(numChildRenders, 1, 'renders SimplePresentational once');
      t.end();
    });
  }
);

tape('Preparing an async app', t => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  let numPrepares = 0;
  class SimpleComponent extends Component<any> {
    constructor(props, context) {
      super(props, context);
      t.equal(
        context.__IS_PREPARE__,
        true,
        'sets __IS_PREPARE__ to true in context'
      );
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
  const AsyncParent = prepared(props => {
    numPrepares++;
    t.equal(
      props.data,
      'test',
      'passes props through to prepared component correctly'
    );
    return Promise.resolve();
  })(SimpleComponent);
  const app = <AsyncParent data="test" />;
  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numPrepares, 1, 'runs the prepare function once');
    t.equal(numConstructors, 1, 'constructs SimpleComponent once');
    t.equal(numRenders, 1, 'renders SimpleComponent once');
    t.equal(numChildRenders, 1, 'renders SimplePresentational once');
    t.end();
  });
});

tape('Preparing an async app with nested asyncs', t => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  let numPrepares = 0;
  class SimpleComponent extends Component<any> {
    constructor(props, context) {
      super(props, context);
      t.equal(
        context.__IS_PREPARE__,
        true,
        'sets __IS_PREPARE__ to true in context'
      );
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
  const AsyncParent = prepared(props => {
    numPrepares++;
    t.equal(
      props.data,
      'test',
      'passes props through to prepared component correctly'
    );
    return Promise.resolve();
  })(SimpleComponent);
  const app = (
    <AsyncParent data="test">
      <AsyncParent data="test">
        <SimplePresentational />
      </AsyncParent>
    </AsyncParent>
  );

  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numPrepares, 2, 'runs each prepare function once');
    t.equal(
      numConstructors,
      2,
      'constructs SimpleComponent once for each render'
    );
    t.equal(numRenders, 2, 'renders SimpleComponent twice');
    t.equal(numChildRenders, 1, 'renders SimplePresentational once');
    t.end();
  });
});

tape('Preparing an app with sibling async components', t => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  let numPrepares = 0;
  class SimpleComponent extends Component<any> {
    constructor(props, context) {
      super(props, context);
      t.equal(
        context.__IS_PREPARE__,
        true,
        'sets __IS_PREPARE__ to true in context'
      );
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
  const AsyncParent = prepared(props => {
    numPrepares++;
    t.equal(
      props.data,
      'test',
      'passes props through to prepared component correctly'
    );
    return Promise.resolve();
  })(SimpleComponent);
  const app = (
    <div>
      <AsyncParent data="test">
        <SimplePresentational />
      </AsyncParent>
      <AsyncParent data="test">
        <SimplePresentational />
      </AsyncParent>
    </div>
  );

  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numPrepares, 2, 'runs each prepare function once');
    t.equal(
      numConstructors,
      2,
      'constructs SimpleComponent once for each render'
    );
    t.equal(numRenders, 2, 'renders SimpleComponent twice');
    t.equal(
      numChildRenders,
      2,
      'renders SimplePresentational once for each render'
    );
    t.end();
  });
});

tape('Rendering a component triggers componentWillMount before render', t => {
  const orderedMethodCalls = [];
  const orderedChildMethodCalls = [];

  // Disable eslint for deprecated componentWillMount
  // eslint-disable-next-line react/no-deprecated
  class SimpleComponent extends Component<any> {
    componentWillMount() {
      orderedMethodCalls.push('componentWillMount');
    }

    render() {
      orderedMethodCalls.push('render');
      return <SimpleChildComponent />;
    }
  }

  // Disable eslint for deprecated componentWillMount
  // eslint-disable-next-line react/no-deprecated
  class SimpleChildComponent extends Component<any> {
    componentWillMount() {
      orderedChildMethodCalls.push('componentWillMount');
    }

    render() {
      orderedChildMethodCalls.push('render');
      return <div>Hello World</div>;
    }
  }

  const app = <SimpleComponent />;
  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.deepEqual(orderedMethodCalls, ['componentWillMount', 'render']);
    t.deepEqual(orderedChildMethodCalls, ['componentWillMount', 'render']);
    t.end();
  });
});

tape('Preparing an async app with componentWillReceiveProps option', t => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  let numPrepares = 0;
  class SimpleComponent extends Component<any> {
    constructor(props, context) {
      super(props, context);
      t.equal(
        context.__IS_PREPARE__,
        true,
        'sets __IS_PREPARE__ to true in context'
      );
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
    props => {
      numPrepares++;
      t.equal(
        props.data,
        'test',
        'passes props through to prepared component correctly'
      );
      return Promise.resolve();
    },
    {
      componentWillReceiveProps: true,
    }
  )(SimpleComponent);
  const app = <AsyncParent data="test" />;
  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numPrepares, 1, 'runs the prepare function once');
    t.equal(numConstructors, 1, 'constructs SimpleComponent once');
    t.equal(numRenders, 1, 'renders SimpleComponent once');
    t.equal(numChildRenders, 1, 'renders SimplePresentational once');
    // triggers componentDidMount
    const wrapper = shallow(app);
    t.equal(numPrepares, 2, 'runs prepare on componentDidMount');
    // triggers componentWillReceiveProps
    wrapper.setProps({test: true});
    t.equal(numPrepares, 3, 'runs prepare on componentWillReceiveProps');
    t.end();
  });
});

tape('Preparing an async app with componentDidUpdate option', t => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  let numPrepares = 0;
  class SimpleComponent extends Component<any> {
    constructor(props, context) {
      super(props, context);
      t.equal(
        context.__IS_PREPARE__,
        true,
        'sets __IS_PREPARE__ to true in context'
      );
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
    props => {
      numPrepares++;
      t.equal(
        props.data,
        'test',
        'passes props through to prepared component correctly'
      );
      return Promise.resolve();
    },
    {
      componentDidUpdate: true,
    }
  )(SimpleComponent);
  const app = <AsyncParent data="test" />;
  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numPrepares, 1, 'runs the prepare function once');
    t.equal(numConstructors, 1, 'constructs SimpleComponent once');
    t.equal(numRenders, 1, 'renders SimpleComponent once');
    t.equal(numChildRenders, 1, 'renders SimplePresentational once');
    // triggers componentDidMount
    const wrapper = shallow(app);
    t.equal(numPrepares, 2, 'runs prepare on componentDidMount');
    // triggers componentDidUpdate
    wrapper.setProps({test: true});
    t.equal(numPrepares, 3, 'runs prepare on componentDidUpdate');
    t.end();
  });
});

tape('Preparing a Fragment', t => {
  const app = (
    // $FlowFixMe
    <React.Fragment>
      <span>1</span>
      <span>2</span>
    </React.Fragment>
  );
  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    const wrapper = shallow(<div>{app}</div>);
    t.equal(wrapper.find('span').length, 2, 'has two children');
    t.end();
  });
});

tape('Preparing a fragment with async children', t => {
  let numChildRenders = 0;
  let numPrepares = 0;
  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const AsyncChild = prepared(props => {
    numPrepares++;
    t.equal(
      props.data,
      'test',
      'passes props through to prepared component correctly'
    );
    return Promise.resolve();
  })(SimplePresentational);
  const app = (
    // $FlowFixMe
    <React.Fragment>
      <AsyncChild data="test" />
      <AsyncChild data="test" />
    </React.Fragment>
  );
  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numPrepares, 2, 'runs prepare function twice');
    t.equal(numChildRenders, 2, 'renders SimplePresentational twice');
    t.end();
  });
});

tape('Preparing React.createContext()', t => {
  // $FlowFixMe
  const {Provider, Consumer} = React.createContext('light');

  const app = (
    <Provider value="light">
      <span>1</span>
      <Consumer>{() => <span>2</span>}</Consumer>
    </Provider>
  );
  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    const wrapper = shallow(<div>{app}</div>);
    t.equal(wrapper.find('span').length, 1, 'one span is rendered');
    t.end();
  });
});

tape('Preparing React.createContext() with async children', t => {
  // $FlowFixMe
  const {Provider, Consumer} = React.createContext('light');

  let numChildRenders = 0;
  let numPrepares = 0;
  let numRenderPropsRenders = 0;
  function SimplePresentational() {
    numChildRenders++;

    return (
      <Consumer>
        {theme => {
          numRenderPropsRenders++;
          t.equal(theme, 'dark', 'passes the context value correctly');
          return <div>{theme}</div>;
        }}
      </Consumer>
    );
  }

  const AsyncChild = prepared(props => {
    numPrepares++;
    t.equal(
      props.data,
      'test',
      'passes props through to prepared component correctly'
    );
    return Promise.resolve();
  })(SimplePresentational);

  const app = (
    <Provider value="dark">
      <AsyncChild data="test" />
      <AsyncChild data="test" />
    </Provider>
  );
  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numPrepares, 2, 'runs prepare function twice');
    t.equal(numRenderPropsRenders, 2, 'prepares consumer render props');
    t.equal(numChildRenders, 2, 'renders SimplePresentational twice');

    t.equal(
      shallow(<div>{app}</div>).html(),
      '<div><div>dark</div><div>dark</div></div>',
      'passes values via context'
    );
    t.end();
  });
});

tape('Preparing React.createContext() with deep async children', t => {
  // $FlowFixMe
  const {Provider, Consumer} = React.createContext('light');

  let numChildRenders = 0;
  let numPrepares = 0;
  let numRenderPropsRenders = 0;
  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }

  const AsyncChild = prepared(props => {
    numPrepares++;
    t.equal(
      props.data,
      'test',
      'passes props through to prepared component correctly'
    );
    return Promise.resolve();
  })(SimplePresentational);

  const ConsumerComponent = () => {
    return (
      <Consumer>
        {theme => {
          numRenderPropsRenders++;
          t.equal(theme, 'dark');
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
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numPrepares, 1, 'runs prepare function');
    t.equal(numChildRenders, 1, 'prepares SimplePresentational');
    t.equal(numRenderPropsRenders, 1, 'runs render prop function');
    t.end();
  });
});

tape('Preparing React.createContext() using the default provider value', t => {
  // $FlowFixMe
  const {Consumer} = React.createContext('light');

  let numChildRenders = 0;
  let numPrepares = 0;
  let numRenderPropsRenders = 0;
  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }

  const AsyncChild = prepared(props => {
    numPrepares++;
    t.equal(
      props.data,
      'test',
      'passes props through to prepared component correctly'
    );
    return Promise.resolve();
  })(SimplePresentational);

  const ConsumerComponent = () => {
    return (
      <Consumer>
        {theme => {
          numRenderPropsRenders++;
          t.equal(theme, 'light');
          return <AsyncChild data="test" />;
        }}
      </Consumer>
    );
  };

  const app = <ConsumerComponent />;
  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numPrepares, 1, 'runs prepare function');
    t.equal(numChildRenders, 1, 'prepares SimplePresentational');
    t.equal(numRenderPropsRenders, 1, 'runs render prop function');
    t.end();
  });
});
