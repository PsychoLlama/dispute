// @flow
import normalizeConfig, { type Config } from './normalize-config';
import { handleKnownErrors, FatalError } from './error-utils';
import * as parseValue from './parse-value';
import parseArgv from './argv-resolver';

export const createCli = (sparseConfig: Config) => {
  const config = normalizeConfig(sparseConfig);

  const execute = async (argv: string[] = process.argv.slice(2)) => {
    const result = parseArgv(config.cli, argv);
    const { command, args, options } = result;

    if (!command.command) {
      // TODO: generate and print the help page.
      throw new FatalError('Invalid command');
    }

    const output = await command.command(options, ...args);

    return {
      ...result,
      output,
    };
  };

  return {
    execute: handleKnownErrors({}, execute),
    createTestInterface: () => {
      return async (...args: string[]) => {
        const { output } = await execute(args);
        return output;
      };
    },
  };
};

export { parseValue, FatalError };
