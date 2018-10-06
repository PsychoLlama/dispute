// @flow
import normalizeConfig, { type Config } from './normalize-config';
import { handleKnownErrors, FatalError } from './error-utils';
import * as parseValue from './parse-value';
import parseArgv from './argv-resolver';

export const createCli = (sparseConfig: Config) => {
  const config = normalizeConfig(sparseConfig);

  return {
    runWithArgs: handleKnownErrors({}, (argv: string[]) => {
      const result = parseArgv(config.cli, argv);
      const { command, args, options } = result;

      if (!command.command) {
        // TODO: include more debugging information.
        throw new FatalError('Invalid command');
      }

      const output = command.command(options, ...args);
      return {
        ...result,
        output: Promise.resolve(output),
      };
    }),
  };
};

export { parseValue, FatalError };
