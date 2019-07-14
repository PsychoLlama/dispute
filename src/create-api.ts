/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommandTree } from './normalize-commands';

type CommandOptions = CommandTree['options'];

// Map<flagName, optionName>
const indexOptionsByName = (options: CommandOptions) => {
  const index = new Map();

  const camelCase = (flag: string) =>
    flag.replace(/-([a-z])/g, (_match, letter) => {
      return letter.toUpperCase();
    });

  Object.keys(options).forEach(optionName => {
    const { long, short } = options[optionName].usage;

    if (long) index.set(camelCase(long), optionName);
    if (short) index.set(short, optionName);
  });

  return index;
};

// We don't want the user depending on option names directly,
// otherwise it would force backwards compatibility (something
// which probably isn't immediately obvious). Instead, only
// expose the contract you've already defined: flags.
const normalizeOptions = (givenOptions: any, options: CommandOptions) => {
  const indexedOptions = indexOptionsByName(options);

  return Object.keys(givenOptions).reduce((result: any, optionKey) => {
    const optionName = indexedOptions.get(optionKey);

    if (typeof optionName === 'string') {
      result[optionName] = givenOptions[optionKey];
    }

    return result;
  }, {});
};

// Reverse the argument order. Instead of `(options, ...args)`
// accept `(...args, options?)`.
const wrapCommand = (command: Function, optionsDefinition: CommandOptions) => (
  ...args: any[]
) => {
  const passedOptions = typeof args[args.length - 1] === 'object';
  const options = passedOptions ? args[args.length - 1] : {};
  const params = passedOptions ? args.slice(0, -1) : args;
  const normalizedOptions = normalizeOptions(options, optionsDefinition);

  return command(normalizedOptions, ...params);
};

export default function createApi(commandTree: CommandTree) {
  const api = commandTree.command
    ? wrapCommand(commandTree.command, commandTree.options)
    : Object.create(null);

  Object.keys(commandTree.subCommands).forEach(commandName => {
    const command = commandTree.subCommands[commandName];
    api[commandName] = createApi(command);
  });

  return api;
}
