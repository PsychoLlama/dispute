import { handleKnownErrors, FatalError, ExitCode } from './error-utils';
import normalizeConfig, { Config } from './normalize-config';
import { getCommandPath } from './help/command';
import * as parseValue from './parse-value';
import parseArgv from './argv-resolver';
import generateHelpPage from './help';
import createApi from './create-api';

export const createCli = (sparseConfig: Config) => {
  const config = normalizeConfig(sparseConfig);

  const execute = async (argv: string[] = process.argv.slice(2)) => {
    const { globalOptions, ...result } = parseArgv(config.cli, argv);
    const { command, args, options } = result;

    // Print the version number and exit successfully.
    if (globalOptions.version) {
      throw new FatalError(config.packageJson.version, 0);
    }

    if (!command.command) {
      const commandPath = getCommandPath(command).join(' ');
      const help = generateHelpPage(command);
      throw new FatalError(`"$ ${commandPath}" isn't a command.\n${help}`);
    }

    const output = await command.command.call(undefined, options, ...args);

    return {
      ...result,
      output,
    };
  };

  return {
    execute: handleKnownErrors({}, execute),
    createApi: () => createApi(config.cli),
    createTestInterface: () => {
      return async (...args: string[]) => {
        const { output } = await execute(args);
        return output;
      };
    },
  };
};

export { parseValue, ExitCode };
