// @flow
import normalizeConfig from '../../normalize-config';
import describeSubCommands from '../sub-commands';

const createConfig = config =>
  normalizeConfig({
    packageJson: { version: '1.2.3' },
    commandName: 'unit-test',
    cli: config,
  });

describe('describeSubCommands(...)', () => {
  it('returns an empty string for no subcommands', () => {
    const config = createConfig();
    const result = describeSubCommands(config.cli.subCommands);

    expect(result).toBe('');
  });

  it('shows every subcommand', () => {
    const remove = { command() {} };
    const add = { command() {} };
    const config = createConfig({ subCommands: { add, remove } });
    const result = describeSubCommands(config.cli.subCommands);

    expect(result).toContain('- remove');
    expect(result).toContain('- add');
  });

  it('sorts subcommands alphabetically', () => {
    const add = { command() {} };
    const branch = { command() {} };
    const checkout = { command() {} };
    const subCommands = { checkout, add, branch };
    const config = createConfig({ subCommands });
    const result = describeSubCommands(config.cli.subCommands);
    const lines = result.split('\n');

    expect(lines[0]).toContain('add');
    expect(lines[1]).toContain('branch');
    expect(lines[2]).toContain('checkout');
  });
});
