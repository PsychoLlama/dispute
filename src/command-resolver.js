// @flow
import type { CommandTree } from './normalize-config';
import { looksLikeFlag } from './normalize-argv';

type ParsedCommand = {
  command: CommandTree,
  args: string[],
};

// Separate the command from the given arguments.
export default function resolveCommand(
  tree: CommandTree,
  argv: string[]
): ParsedCommand {
  const annoyinglyPlacedFlags = [];
  const stack = argv.slice();
  let finalCommand = tree;

  // Traverse the subcommand tree until the arguments
  // run out, or there isn't a subcommand by that name.
  while (stack.length) {
    const commandName = stack[0];

    // Some users put flags before subcommands. The assumption
    // is no leading flag accepts parameters, unless they
    // specify them together like `-p=8080`. Relocate them
    // to after the last subcommand.
    if (looksLikeFlag(commandName)) {
      annoyinglyPlacedFlags.push(commandName);
      stack.shift();
      continue;
    }

    // We've hit the end of the subcommand tree.
    const { subCommands } = finalCommand;
    if (!subCommands.hasOwnProperty(commandName)) {
      break;
    }

    // Continue searching for more subcommands.
    finalCommand = subCommands[commandName];
    stack.shift();
  }

  return {
    args: annoyinglyPlacedFlags.concat(stack),
    command: finalCommand,
  };
}
