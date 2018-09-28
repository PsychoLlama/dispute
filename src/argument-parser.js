// @flow
import type { CommandTree } from './normalize-config';

type Argv = string[];
type ParsedOptions = { [string]: mixed };

const parseOptions = (): ParsedOptions => {
  return {};
};

// Separate the command from the given arguments.
const getCommandAndArgs = (
  tree: CommandTree,
  argv: string[]
): { command: CommandTree, args: string[] } => {
  let finalCommand = tree;

  // Traverse the subcommand tree until the arguments
  // run out, or there isn't a subcommand by that name.
  for (const commandName of argv) {
    const { subCommands = {} } = finalCommand;
    if (!subCommands.hasOwnProperty(commandName)) {
      break;
    }

    finalCommand = subCommands[commandName];
    argv = argv.slice(1);
  }

  return {
    command: finalCommand,
    args: argv,
  };
};

type ParsedCommand = {
  options: ParsedOptions,
  command: CommandTree,
  args: string[],
};

export default function parse(tree: CommandTree, argv: Argv): ParsedCommand {
  return {
    ...getCommandAndArgs(tree, argv),
    options: parseOptions(),
  };
}
