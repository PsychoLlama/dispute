// @flow
import chalk from 'chalk';

import { normalizeOptions, type CommandTree } from './normalize-commands';
import validateArguments from './argument-validator';
import resolveSubCommand from './command-resolver';
import { FatalError } from './error-utils';
import generateHelpPage from './help';
import parseArgv from './argv-parser';

/**
 * This is the function that brings it all together. Not much
 * logic here, just glue.
 */
export default (commandTree: CommandTree, argv: string[]) => {
  const { command, args: subCommandArgs } = resolveSubCommand(
    commandTree,
    argv
  );

  const { options, args, globalOptions, invalidOptions } = parseArgv(
    command,
    normalizeOptions({
      commandPath: [],
      options: {
        version: { usage: '-v, --version' },
        help: { usage: '-h, --help' },
      },
    }),
    subCommandArgs
  );

  // Print the help page and exit successfully.
  if (globalOptions.help) {
    throw new FatalError(generateHelpPage(command), 0);
  }

  validateArguments(command, args);

  // It's a full list for convenience, even though
  // only the first invalid option gets reported.
  if (invalidOptions.length) {
    const unknownFlag = chalk.red(invalidOptions[0]);
    throw new FatalError(
      `${chalk.red('Error')}: Unknown option ${unknownFlag}.\n` +
        generateHelpPage(command)
    );
  }

  return {
    globalOptions,
    command,
    options,
    args,
  };
};
