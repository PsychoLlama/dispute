import chalk from 'chalk';

import { CommandTree } from './normalize-commands';
import { FatalError } from './error-utils';

export default function validateArguments(
  commandTree: CommandTree,
  givenArgs: string[]
) {
  const commandName = `"${commandTree.name}"`;
  const requiredArgs = commandTree.args.filter(arg => arg.required);
  const maxArguments = commandTree.args.reduce((sum, arg) => {
    return sum + (arg.variadic ? Infinity : 1);
  }, 0);

  // Arguments were given but the command doesn't accept any.
  if (givenArgs.length && !commandTree.args.length) {
    throw new FatalError(
      `${chalk.red('Error')}: ${commandName} doesn't take arguments.`
    );
  }

  // More arguments were given than allowed.
  if (givenArgs.length > maxArguments) {
    const givenCount = chalk.red(String(givenArgs.length));
    const maxCount = chalk.green(String(maxArguments));

    throw new FatalError(
      `${chalk.red('Error')}: ${commandName} was given too many arguments.\n` +
        `At most there should be ${maxCount}, but it was given ${givenCount}.`
    );
  }

  if (givenArgs.length >= requiredArgs.length) {
    return;
  }

  const missingArgument = requiredArgs[givenArgs.length];
  throw new FatalError(
    `The ${chalk.red(missingArgument.raw)} argument is required.`
  );
}
