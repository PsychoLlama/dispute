// @flow
import type { CommandTree } from './normalize-commands';

// Reverse the argument order. Instead of `(options, ...args)`
// accept `(...args, options?)`.
const wrapCommand = command => (...args) => {
  const passedOptions = typeof args[args.length - 1] === 'object';
  const options = passedOptions ? args[args.length - 1] : {};
  const params = passedOptions ? args.slice(0, -1) : args;

  return command(options, ...params);
};

// Forgive me. The return value is convenient and predictable,
// but comes at the cost of type inference. It's too sketchy
// for Flow to understand. My hope is that either the CLI
// builder will add Flow (unlikely) or that consumers will
// contribute a solid typedef per package to flow-typed. I
// don't see an easier way.
type Api = any;

export default function createApi(commandTree: CommandTree): Api {
  const api = commandTree.command
    ? wrapCommand(commandTree.command)
    : Object.create(null);

  Object.keys(commandTree.subCommands).forEach(commandName => {
    const command = commandTree.subCommands[commandName];
    api[commandName] = createApi(command);
  });

  return api;
}
