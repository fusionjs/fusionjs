import nodeMockContext from './node-mock-context.js';

export const mockContext = __NODE__
  ? nodeMockContext
  : () => {
      throw new Error(
        'mockContext test util not implemented in the browser yet.'
      );
    };
