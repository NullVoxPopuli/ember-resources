/* eslint-disable @typescript-eslint/ban-types */

const DEFAULT_THUNK = () => [];
function normalizeThunk(thunk) {
  if (!thunk) {
    return {
      named: {},
      positional: []
    };
  }
  let args = thunk();
  if (Array.isArray(args)) {
    return {
      named: {},
      positional: args
    };
  }
  if (!args) {
    return {
      named: {},
      positional: []
    };
  }

  /**
   * Hopefully people aren't using args named "named"
   */
  if ('positional' in args || 'named' in args) {
    return args;
  }
  return {
    named: args,
    positional: []
  };
}

export { DEFAULT_THUNK, normalizeThunk };
//# sourceMappingURL=utils.js.map
