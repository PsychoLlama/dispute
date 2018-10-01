// @flow
import chalk from 'chalk';

// Same implementation as Error. The only advantage is
// the ability to distinguish it from other errors.
export class ParseError extends Error {}

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
