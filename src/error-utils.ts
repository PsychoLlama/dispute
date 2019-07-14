// @flow
import chalk from 'chalk';

// eslint-disable-next-line no-console
const DEFAULT_ERROR_LOG = console.error;
const ENABLE_ERROR_LOGGING = Symbol('Dispute: ENABLE_ERROR_LOGGING');
const KNOWN_ERROR_KEY = Symbol('Dispute: KNOWN_ERROR_KEY');

const noop = () => {};

export class ExitCode extends Error {
  exitCode: number;

  constructor(exitCode: number) {
    super(`ExitCode(${exitCode})`);

    Object.defineProperties(this, {
      [KNOWN_ERROR_KEY]: {
        enumerable: false,
        writable: false,
        value: true,
      },
      exitCode: {
        enumerable: true,
        writable: false,
        value: exitCode,
      },
    });
  }
}

// Something unrecoverable happened. Print the error
// message (without a stack trace) and exit with the
// given code.
export class FatalError extends ExitCode {
  exitCode: number;

  constructor(message: string, exitCode: number = 1) {
    super(exitCode);

    this.message = message;
    Object.defineProperty(this, ENABLE_ERROR_LOGGING, {
      value: true,
    });
  }
}

// I hate names like these. How did my life get here.
export const makeParseErrorFactory = ({
  flag,
  prefix = 'Invalid value',
}: {
  flag: string;
  prefix?: string;
}) => (msg: string) => {
  const trace = `at ${chalk.blue(flag)}`;
  const errorPrefix = `${chalk.red(prefix)} ${trace}`;

  return new FatalError(`${errorPrefix}: ${msg}`);
};

// Check the error for a secret flag.
export const isKnownError = <T>(error: T) => {
  if (!(error instanceof Object)) return false;

  return Boolean(error[KNOWN_ERROR_KEY]);
};

// By the time we make it here, the error has
// been reported and the process is terminating.
// Return a rejection, but keep it silent.
const createHandledRejection = error => {
  const rejection = Promise.reject(error);
  rejection.catch(noop);

  return rejection;
};

type ErrorHandlerOptions = {
  log?: (msg: string) => void;
};

export const handleKnownErrors = <ArgType, T>(
  options: ErrorHandlerOptions,
  fn: (args: ArgType) => T
) => async (args: ArgType): Promise<T> => {
  /* istanbul ignore next */
  const { log = DEFAULT_ERROR_LOG } = options;

  try {
    return await fn(args);
  } catch (error) {
    if (!isKnownError(error)) {
      log(error);
      process.exit(1);

      return createHandledRejection(error);
    }

    if (error[ENABLE_ERROR_LOGGING]) {
      log(error.message);
    }

    process.exit(error.exitCode);

    return createHandledRejection(error);
  }
};
