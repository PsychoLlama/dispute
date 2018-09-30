// @flow
import assert from 'minimalistic-assert';

/* istanbul ignore next */
const noop = () => {};

type Options = {};
type Command = (options: Options) => mixed;

type CommandOption = {
  parseValue?: ParseValue,
  description?: string,
  usage: string,
};

// TODO: figure out how this should work.
type ParseValue = (input: { value: string }) => void;

type Subcommands<Subcommand> = {
  [commandName: string]: Subcommand,
};

type CommandOptions<ParseValue: Object> = {
  [optionName: string]: CommandOption & ParseValue,
};

// Loose type. Allows undefined fields.
type CommandOptionsLoose = CommandOptions<{ parseValue?: ParseValue }>;
type Config = {
  subCommands?: Subcommands<Config>,
  options?: CommandOptionsLoose,
  command?: Command,
  args?: string,
};

// Strict type. All fields must have defaults.
type CommandOptionsStrict = CommandOptions<{ parseValue: ParseValue }>;
export type CommandTree = {|
  subCommands: Subcommands<CommandTree>,
  options: CommandOptionsStrict,
  args: string | null,
  command?: Command,
|};

/**
 * Validate the config object and provide defaults recursively.
 */
export default function normalizeConfig(
  config: Config,
  commandPath: string[] = []
): CommandTree {
  const { command, subCommands = {}, options = {}, args = null } = config;

  // A tiny bit of validation.
  if (!command) {
    assert(
      !args,
      `Arguments were defined for a command that doesn't exist.` +
        generateFieldTrace(commandPath, 'args')
    );

    assert(
      !config.options,
      `Options were defined for a command that doesn't exist.` +
        generateFieldTrace(commandPath, 'options')
    );
  }

  return {
    subCommands: normalizeSubcommands(subCommands, commandPath),
    options: normalizeOptions(options, commandPath),
    command,
    args,
  };
}

// Return a string like 'config.subCommands.init.options'.
const describeConfigPath = (commandPath: string[]) => {
  const commandNamePrefix = commandPath.length
    ? 'config.subCommands.'
    : 'config';

  return `${commandNamePrefix}${commandPath.join('.subCommands.')}`;
};

const generateFieldTrace = (commandPath: string[], field: string) => {
  const commandName = describeConfigPath(commandPath);

  return `\n  At: ${commandName}.${field}`;
};

// Recursively apply normalizeConfig(...) to each subcommand.
const normalizeSubcommands = (
  commands: Subcommands<Config>,
  commandPath: string[]
): Subcommands<CommandTree> => {
  const commandNames = Object.keys(commands);

  return commandNames.reduce((subCommands, commandName) => {
    const command = commands[commandName];
    const path = commandPath.concat(commandName);
    subCommands[commandName] = normalizeConfig(command, path);

    return subCommands;
  }, {});
};

// Add defaults to every option.
const normalizeOptions = (
  options: CommandOptionsLoose,
  commandPath: string[]
): CommandOptionsStrict => {
  const defaults = {
    parseValue: noop,
  };

  const optionNames = Object.keys(options);
  return optionNames.reduce((commandOptions, optionName) => {
    const option = options[optionName];
    assert(
      option.usage,
      `An option is missing the required '.usage' field.` +
        generateFieldTrace(commandPath, `options.${optionName}`)
    );

    commandOptions[optionName] = {
      ...defaults,
      ...option,
    };

    return commandOptions;
  }, {});
};
