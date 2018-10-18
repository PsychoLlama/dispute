// @flow
import generateHelpPage, {
  describeSubcommands,
  describeOptionUsage,
  describeCommandUsage,
} from '../generate-help-page';
import normalizeConfig from '../normalize-config';

const createConfig = config =>
  normalizeConfig({
    packageJson: { version: '1.2.3' },
    commandName: 'unit-test',
    cli: config,
  });

describe('Help page generator', () => {
  describe('generateHelpPage(...)', () => {
    it('returns a string', () => {
      const config = createConfig({});
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
  });

  describe('describeOptionUsage(...)', () => {
    const createOption = usage => {
      const config = createConfig({
        command() {},
        options: {
          normalized: { usage },
        },
      });

      return config.cli.options.normalized;
    };

    it('returns a string', () => {
      const option = createOption('--port');
      const result = describeOptionUsage(option);

      expect(result).toBe('--port');
    });

    it('describes short options', () => {
      const option = createOption('-p');
      const result = describeOptionUsage(option);

      expect(result).toBe('-p');
    });

    it('combines short and long options', () => {
      const option = createOption('--port, -p');
      const result = describeOptionUsage(option);

      expect(result).toBe('-p, --port');
    });

    it('shows required arguments', () => {
      const option = createOption('-p <port>');
      const result = describeOptionUsage(option);

      expect(result).toBe('-p <port>');
    });

    it('shows optional arguments', () => {
      const option = createOption('-q [bool]');
      const result = describeOptionUsage(option);

      expect(result).toBe('-q [bool]');
    });
  });

  describe('describeSubcommands(...)', () => {
    it('returns an empty string for no subcommands', () => {
      const config = createConfig();
      const result = describeSubcommands(config.cli.subCommands);

      expect(result).toBe('');
    });

    it('shows every subcommand', () => {
      const remove = { command() {} };
      const add = { command() {} };
      const config = createConfig({ subCommands: { add, remove } });
      const result = describeSubcommands(config.cli.subCommands);

      expect(result).toContain('- remove');
      expect(result).toContain('- add');
    });

    it('sorts subcommands alphabetically', () => {
      const add = { command() {} };
      const branch = { command() {} };
      const checkout = { command() {} };
      const subCommands = { checkout, add, branch };
      const config = createConfig({ subCommands });
      const result = describeSubcommands(config.cli.subCommands);
      const lines = result.split('\n');

      expect(lines[0]).toContain('add');
      expect(lines[1]).toContain('branch');
      expect(lines[2]).toContain('checkout');
    });
  });
});
