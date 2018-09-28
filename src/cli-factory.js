// @flow
type Options = {};
type Command = (options: Options) => mixed;

type CommandOptions = {
  parseValue?: ParseValue,
  description?: string,
  usage: string,
};

// TODO: figure out how this should work.
type ParseValue = (input: { value: string }) => void;

export type CommandTree = {
  arguments?: string,
  command?: Command,

  // Subcommands can be infinitely nested.
  subCommands?: {
    [commandName: string]: CommandTree,
  },

  options?: {
    [optionName: string]: CommandOptions,
  },
};
