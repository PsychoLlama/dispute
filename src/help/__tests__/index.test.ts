import normalizeConfig from '../../normalize-config';
import generateHelpPage from '../index';

const createConfig = <T>(config?: T) =>
  normalizeConfig({
    packageJson: { version: '1.2.3' },
    commandName: 'unit-test',
    cli: config,
  });

describe('generateHelpPage(...)', () => {
  it('returns a string', () => {
    const config = createConfig({ command() {} });
    const result = generateHelpPage(config.cli);

    expect(result).toEqual(expect.any(String));
  });

  it('describes the command in focus', () => {
    const config = createConfig({
      args: '<project>',
      command() {},
    });

    const result = generateHelpPage(config.cli);

    expect(result).toContain(config.cli.name);
    expect(result).toContain('<project>');
  });

  it('shows all the options', () => {
    const quiet = { usage: '-q, --quiet' };
    const port = { usage: '-p, --port <number>' };
    const config = createConfig({
      options: { quiet, port },
      command() {},
    });

    const result = generateHelpPage(config.cli);

    expect(result).toContain(quiet.usage);
    expect(result).toContain(port.usage);
  });

  it('skips options if none exist', () => {
    const config = createConfig({ command() {} });
    const result = generateHelpPage(config.cli);

    expect(result).not.toContain('Options:');
  });

  it('shows all the subcommands', () => {
    const remove = { command() {} };
    const add = { command() {} };
    const subCommands = { add, remove };
    const config = createConfig({ command() {}, subCommands });
    const result = generateHelpPage(config.cli);

    expect(result).toContain('add');
    expect(result).toContain('remove');
  });

  it('skips subcommands if none exist', () => {
    const config = createConfig();
    const result = generateHelpPage(config.cli);

    expect(result).not.toMatch(/commands/i);
  });

  it('suggests help for sub-commands at the bottom', () => {
    const subCommands = { add: { command() {} } };
    const config = createConfig({ subCommands });
    const result = generateHelpPage(config.cli);

    expect(result).toContain(`${config.cli.name} COMMAND --help`);
  });

  it('omits sub-command help suggestions if no sub-commands exist', () => {
    const config = createConfig({ command() {} });
    const result = generateHelpPage(config.cli);

    expect(result).not.toContain('COMMAND --help');
  });
});
