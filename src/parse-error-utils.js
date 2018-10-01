// @flow
import chalk from 'chalk';

// eslint-disable-next-line no-console
const DEFAULT_ERROR_LOG = console.error;
const KNOWN_ERROR_KEY = Symbol('Dispute: KNOWN_ERROR_KEY');

// Something unrecoverable happened. Print the error
// message (without a stack trace) and exit with the
// given code.
export class FatalError extends Error {
  exitCode: number;

  constructor(message: string, exitCode: number = 1) {
    super(message);

    this.exitCode = exitCode;

    Object.defineProperty(this, KNOWN_ERROR_KEY, {
      enumerable: false,
      writable: false,
      value: true,
    });
  }
}

// Same implementation as Error. The only advantage is
// the ability to distinguish it from other errors.
export class ParseError extends Error {
  constructor(message: string) {
    super(message);

    Object.defineProperty(this, KNOWN_ERROR_KEY, {
      enumerable: false,
      writable: false,
      value: true,
    });
  }
}

// I hate names like these. How did my life get here.
export const makeParseErrorFactory = ({
  flag,
  prefix = 'Invalid value',
}: {
  flag: string,
  prefix?: string,
}) => (msg: string) => {
  const trace = `at ${chalk.blue(flag)}`;
  const errorPrefix = `${chalk.red(prefix)} ${trace}`;

  return new ParseError(`${errorPrefix}: ${msg}`);
};

// Check the error for a secret flag.
export const isKnownError = (error: mixed) => {
  if (!(error instanceof Object)) return false;

  return Boolean(error[KNOWN_ERROR_KEY]);
};

const isTestEnv = () => {
  return process.env.NODE_ENV === 'test';
};

type ErrorHandlerOptions = {
  checkTestEnvBeforeExiting?: boolean,
  log?: (msg: string) => void,
};

export const handleKnownErrors = (
  options: ErrorHandlerOptions,
  fn: (...args: *) => *
) => (...args: *) => {
  /* istanbul ignore next */
  const { checkTestEnvBeforeExiting = true, log = DEFAULT_ERROR_LOG } = options;

  try {
    return fn(...args);
  } catch (error) {
    const shouldThrowNormally = checkTestEnvBeforeExiting ? isTestEnv() : false;

    // If it's a normal JavaScript error, continue throwing.
    // If not, only exit outside the test window.
    if (shouldThrowNormally || !isKnownError(error)) {
      throw error;
    }

    log(error.message);
    process.exit(error.exitCode);

    return error;
  }
};
