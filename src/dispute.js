// @flow
import normalizeConfig, { type Config } from './normalize-config';
import { handleKnownErrors, FatalError } from './error-utils';
import * as parseValue from './parse-value';
import parseArgv from './argv-resolver';

export const createCli = (sparseConfig: Config) => {
  const config = normalizeConfig(sparseConfig);

  const runWithArgs = async (argv: string[]) => {
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
    runWithArgs: handleKnownErrors({}, runWithArgs),
    createTestInterface: () => {
      return async (...args: string[]) => {
        const { output } = await runWithArgs(args);
        return output;
      };
    },
  };
};

export { parseValue, FatalError };
