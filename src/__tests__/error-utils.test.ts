import {
  ExitCode,
  FatalError,
  isKnownError,
  handleKnownErrors,
} from '../error-utils';

describe('ExitCode', () => {
  it('is an error', () => {
    const error = new ExitCode(5);

    expect(error).toEqual(expect.any(Error));
    expect(isKnownError(error)).toBe(true);
  });

  it('exposes the exit code', () => {
    const error = new ExitCode(3);

    expect(error).toMatchObject({ exitCode: 3 });
  });

  it('sets some default message', () => {
    const error = new ExitCode(3);

    expect(error.message).toMatch(/exit/i);
  });

  // Prevents weird boolean `exitCode || 1` stuff.
  it('works with exit code 0', () => {
    const error = new ExitCode(0);

    expect(error).toMatchObject({ exitCode: 0 });
  });
});

describe('FatalError', () => {
  const message = 'Testing FatalError(...)';

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
    expect(isKnownError(new ExitCode(1))).toBe(true);
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
    log: jest.fn(),
  };

  // Don't try this at home.
  beforeAll(() => {
    jest.spyOn(process, 'exit');
    (process.exit as any).mockImplementation(() => {});
  });

  afterAll(() => {
    (process.exit as any).mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards input and output if no errors occur', async () => {
    const input = ['1', '2', '3'];
    const handler = jest.fn().mockResolvedValue('return value');
    const wrapped = handleKnownErrors(options, handler);
    const result = await wrapped(input);

    expect(handler).toHaveBeenCalledWith(input);
    expect(result).toBe('return value');
  });

  it('exits with the given error code', async () => {
    const wrapped = handleKnownErrors(options, () => {
      throw new FatalError(message, 10);
    });

    await expect(wrapped()).rejects.toMatchObject({ exitCode: 10 });
    expect(process.exit).toHaveBeenCalledWith(10);
  });

  it('exits non-zero for parse errors', async () => {
    const wrapped = handleKnownErrors(options, () => {
      throw new FatalError(message);
    });

    await expect(wrapped()).rejects.toBeDefined();

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('prints the error to the console', async () => {
    const wrapped = handleKnownErrors(options, () => {
      throw new FatalError(message);
    });

    await expect(wrapped()).rejects.toBeDefined();

    expect(options.log).toHaveBeenCalledWith(message);
  });

  it('ignores `ExitCode` error messages', async () => {
    const wrapped = handleKnownErrors(options, () => {
      throw new ExitCode(1);
    });

    await expect(wrapped()).rejects.toBeDefined();

    expect(options.log).not.toHaveBeenCalled();
  });

  it('prints unknown errors and exits', async () => {
    const wrapped = handleKnownErrors(options, () => {
      throw new Error(message);
    });

    const error = await wrapped().catch(error => error);

    expect(error).toEqual(expect.any(Error));
    expect(options.log).toHaveBeenCalledWith(error);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(process.exit).toHaveBeenCalledTimes(1);
  });
});
