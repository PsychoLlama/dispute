// @flow
import assert from 'minimalistic-assert';
import chalk from 'chalk';

import normalizeCommands, {
  type CommandTree,
  type CommandConfig,
} from './normalize-commands';

// Right now `version` is the only thing dispute depends
// on. In the future it could be expanded to show
// "bugs.url" on unhandled errors, print the license
// & homepage in `help`, detect manpages, etc.
type PkgJson = {
  version: string,
};

export type Config = {
  commandName: string,
  cli?: CommandConfig,
  pkg: PkgJson,
};

export type NormalizedConfig = {
  commandName: string,
  cli: CommandTree,
  pkg: PkgJson,
};

/**
 * Validate, index, and add defaults for the config object.
 */
export default function normalizeConfig(config: Config): NormalizedConfig {
  assert(
    config.commandName,
    `Missing ${chalk.red('config.commandName')}. What is your CLI named?`
  );

  assert(
    config.pkg,
    `Missing ${chalk.red(
      'config.pkg'
    )}. Import your package.json and add it here.`
  );

  const cli: CommandTree = normalizeCommands(config.cli || {}, {
    name: config.commandName,
  });

  return {
    commandName: '',
    pkg: config.pkg,
    cli,
  };
}
