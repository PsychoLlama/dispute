import normalizeConfig from '../../normalize-config';
import describeSubCommands from '../sub-commands';

const createConfig = (config?: object) => {
  const { cli } = normalizeConfig({
    packageJson: { version: '1.2.3' },
    cli: { command() {}, ...config },
    commandName: 'unit-test',
  });

  return cli.subCommands;
};

describe('describeSubCommands(...)', () => {
  it('returns an empty string for no subcommands', () => {
    const config = createConfig();
    const result = describeSubCommands(config);

    expect(result).toBe('');
  });

  it('shows every subcommand', () => {
    const remove = { command() {} };
    const add = { command() {} };
    const config = createConfig({ subCommands: { add, remove } });
    const result = describeSubCommands(config);

    expect(result).toContain('remove');
    expect(result).toContain('add');
  });

  it('sorts subcommands alphabetically', () => {
    const add = { command() {}, description: 'Stage a file' };
    const branch = { command() {}, description: 'Create a branch' };
    const checkout = { command() {}, description: 'Switch to a branch' };
    const subCommands = { checkout, add, branch };
    const config = createConfig({ subCommands });
    const result = describeSubCommands(config);
    const lines = result.split('\n');

    expect(lines[0]).toContain('add');
    expect(lines[1]).toContain('branch');
    expect(lines[2]).toContain('checkout');
  });

  it('shows descriptions', () => {
    const add = { command() {}, description: 'Stage a file' };
    const config = createConfig({ subCommands: { add } });
    const result = describeSubCommands(config);

    expect(result).toContain(add.description);
  });

  it('skips descriptions if omitted', () => {
    const add = { command() {} };
    const config = createConfig({ subCommands: { add } });
    const result = describeSubCommands(config);

    expect(result).not.toMatch(/(null|undefined)/);
  });
});
