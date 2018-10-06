// @flow
import type { CommandTree } from './normalize-config';
import validateArguments from './argument-validator';
import resolveSubCommand from './command-resolver';
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

  const { options, args } = parseArgv(command, subCommandArgs);
  validateArguments(command, args);

  return {
    command,
    options,
    args,
  };
};
