import describeCommandUsage from '../command';
import normalizeConfig from '../../normalize-config';

const createConfig = (config: object) =>
  normalizeConfig({
    packageJson: { version: '1.2.3' },
    commandName: 'unit-test',
    cli: config,
  });

describe('describeCommandUsage(...)', () => {
  it('returns a string', () => {
    const args = '<project> [type...]';
    const config = createConfig({ args, command() {} });
    const result = describeCommandUsage(config.cli);

    expect(result).toContain(config.cli.name);
    expect(result).toContain(args);
  });

  it('omits the arguments if there are none', () => {
    const config = createConfig({ command() {} });
    const result = describeCommandUsage(config.cli);

    expect(result).toMatch(/unit-test$/);
  });

  it('shows the full command path', () => {
    const run = { command() {} };
    const subCommands = { run };
    const config = createConfig({ subCommands });
    const result = describeCommandUsage(config.cli.subCommands.run);

    expect(result).toContain(`${config.cli.name} run`);
  });

  it('prints the description', () => {
    const run = { command() {}, description: 'Execute any npm command' };
    const config = createConfig(run);
    const result = describeCommandUsage(config.cli);

    expect(result).toContain(run.description);
  });

  it('shows a required argument if there are only sub-commands', () => {
    const add = { command() {} };
    const description = 'Manage upstream URLs';
    const remote = { subCommands: { add }, description };
    const config = createConfig(remote);
    const result = describeCommandUsage(config.cli);

    expect(result).toContain('COMMAND');
    expect(result).toContain(description);
  });
});
