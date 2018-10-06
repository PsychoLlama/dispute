// @flow
import {
  FatalError,
  ParseError,
  isKnownError,
  handleKnownErrors,
} from '../error-utils';

describe('FatalError', () => {
  const message = 'Testing FatalError(...)';
  it('creates an error instance', () => {
    const error = new FatalError(message, 1);

    expect(error).toEqual(expect.any(Error));
  });

  it('assigns the given message', () => {
    const error = new FatalError(message, 1);

    expect(error.message).toBe(message);
  });

  it('assigns the exit code', () => {
    const error = new FatalError(message, 6);

    expect(error.exitCode).toBe(6);
  });

  it('adds a default exit code', () => {
    const error = new FatalError(message);

    expect(error.exitCode).toBe(1);
  });
});

describe('isKnownError', () => {
  it('returns true for known errors', () => {
    expect(isKnownError(new FatalError('hi'))).toBe(true);
    expect(isKnownError(new ParseError('hi'))).toBe(true);
  });

  it('returns false for unknown errors', () => {
    expect(isKnownError(new Error('hi'))).toBe(false);
    expect(isKnownError(new RangeError('hi'))).toBe(false);
  });

  it('survives if the thrown value is a falsy primitive', () => {
    expect(isKnownError(null)).toBe(false);
  });
});

describe('handleKnownErrors(...)', () => {
  const message = 'Testing handleKnownErrors(...)';
  const options = {
    checkTestEnvBeforeExiting: false,
    log: jest.fn(),
  };

  // Don't try this at home.
  beforeAll(() => {
    jest.spyOn(process, 'exit').mockReturnValue();
  });

  afterAll(() => {
    process.exit.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards input and output if no errors occur', () => {
    const input = ['1', '2', '3'];
    const handler = jest.fn().mockReturnValue('return value');
    const wrapped = handleKnownErrors(options, handler);
    const result = wrapped(...input);

    expect(handler).toHaveBeenCalledWith(...input);
    expect(result).toBe('return value');
  });

  it('exits with the given error code', () => {
    const wrapped = handleKnownErrors(options, () => {
      throw new FatalError(message, 10);
    });

    expect(wrapped).not.toThrow();
    expect(wrapped()).toMatchObject({ exitCode: 10 });
    expect(process.exit).toHaveBeenCalledWith(10);
  });

  it('exits non-zero for parse errors', () => {
    const wrapped = handleKnownErrors(options, () => {
      throw new ParseError(message);
    });

    wrapped();

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('prints the error to the console', () => {
    const wrapped = handleKnownErrors(options, () => {
      throw new ParseError(message);
    });

    wrapped();

    expect(options.log).toHaveBeenCalledWith(message);
  });

  it('lets unknown errors fall through', () => {
    const wrapped = handleKnownErrors(options, () => {
      throw new Error(message);
    });

    expect(wrapped).toThrow(message);
  });

  it('does not exit in a test environment', () => {
    const enableTestEnvCheck = {
      ...options,
      checkTestEnvBeforeExiting: true,
    };

    const wrapped = handleKnownErrors(enableTestEnvCheck, () => {
      throw new FatalError(message);
    });

    expect(wrapped).toThrow(message);
    expect(process.exit).not.toHaveBeenCalled();
  });
});
