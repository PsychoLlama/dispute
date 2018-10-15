// @flow
import chalk from 'chalk';

import type { CommandTree } from './normalize-commands';
import validateArguments from './argument-validator';
import resolveSubCommand from './command-resolver';
import { FatalError } from './error-utils';
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

  const { options, args, invalidOptions } = parseArgv(
    command,
    {},
    subCommandArgs
  );

  validateArguments(command, args);

  // It's a full list for convenience, even though
  // only the first invalid option gets reported.
  if (invalidOptions.length) {
    const unknownFlag = chalk.red(invalidOptions[0]);
    throw new FatalError(
      `${chalk.red('Error')}: Unknown option ${unknownFlag}.`
    );
  }

  return {
    command,
    options,
    args,
  };
};
