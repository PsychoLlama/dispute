// @flow
import { handleKnownErrors, FatalError } from './parse-error-utils';
import normalizeConfig, { type Config } from './normalize-commands';
import parseArgv from './argv-resolver';

export const createCli = (config: Config) => {
  const commandTree = normalizeConfig(config);

  return {
    runWithArgs: handleKnownErrors({}, (argv: string[]) => {
      const result = parseArgv(commandTree, argv);
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
