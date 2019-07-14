// @flow
import type { CommandTree } from './normalize-commands';

// Map<flagName, optionName>
const indexOptionsByName = options => {
  const index = new Map();

  const camelCase = flag =>
    flag.replace(/-([a-z])/g, (match, letter) => {
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
const normalizeOptions = (givenOptions, options) => {
  const indexedOptions = indexOptionsByName(options);

  return Object.keys(givenOptions).reduce((result, optionKey) => {
    const optionName = indexedOptions.get(optionKey);

    if (typeof optionName === 'string') {
      result[optionName] = givenOptions[optionKey];
    }

    return result;
  }, {});
};

// Reverse the argument order. Instead of `(options, ...args)`
// accept `(...args, options?)`.
const wrapCommand = (command, optionsDefinition) => (...args) => {
  const passedOptions = typeof args[args.length - 1] === 'object';
  const options = passedOptions ? args[args.length - 1] : {};
  const params = passedOptions ? args.slice(0, -1) : args;
  const normalizedOptions = normalizeOptions(options, optionsDefinition);

  return command(normalizedOptions, ...params);
};

// Forgive me. The return value is convenient and predictable,
// but comes at the cost of type inference. It's too sketchy
// for Flow to understand. My hope is that either CLI authors
// will add Flow (unlikely) or that consumers will contribute
// a solid typedef per package to flow-typed. I don't see an
// easier way.
type Api = any;

export default function createApi(commandTree: CommandTree): Api {
  const api = commandTree.command
    ? wrapCommand(commandTree.command, commandTree.options)
    : Object.create(null);

  Object.keys(commandTree.subCommands).forEach(commandName => {
    const command = commandTree.subCommands[commandName];
    api[commandName] = createApi(command);
  });

  return api;
}
