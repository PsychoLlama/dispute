import chalk from 'chalk';

// eslint-disable-next-line no-console
const DEFAULT_ERROR_LOG = console.error;
const ENABLE_ERROR_LOGGING = Symbol('Dispute: ENABLE_ERROR_LOGGING');

const noop = () => {};

export class ExitCode extends Error {
  public exitCode: number;

  public constructor(exitCode: number) {
    super(`ExitCode(${exitCode})`);

    this.exitCode = 0;
    Object.defineProperties(this, {
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
  public [ENABLE_ERROR_LOGGING]: boolean;

  public constructor(message: string, exitCode = 1) {
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

  return error instanceof ExitCode;
};

// By the time we make it here, the error has
// been reported and the process is terminating.
// Return a rejection, but keep it silent.
const createHandledRejection = <T extends Error>(error: T) => {
  const rejection = Promise.reject(error);
  rejection.catch(noop);

  return rejection;
};

interface ErrorHandlerOptions {
  log?: (msg: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReturnType<Fn extends (...args: any) => any> = Fn extends (
  ...args: any[]
) => infer T
  ? T
  : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ArgumentType<Fn extends (...args: any) => any> = Fn extends (
  ...args: infer T
) => any
  ? T
  : never;

export const handleKnownErrors = <Fn extends (...args: any) => any>(
  options: ErrorHandlerOptions,
  fn: Fn
) => async (...args: ArgumentType<Fn>): Promise<ReturnType<Fn>> => {
  /* istanbul ignore next */
  const { log = DEFAULT_ERROR_LOG } = options;

  try {
    return await fn(...(args as any));
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
