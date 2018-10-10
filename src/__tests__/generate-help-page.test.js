// @flow
import generateHelpPage, {
  indent,
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

  describe('indent(...)', () => {
    it('indents the given content', () => {
      const result = indent(2, 'content');

      expect(result).toBe('  content');
    });

    it('indents across multiple lines', () => {
      const result = indent(2, 'line1\nline2\nline3');

      expect(result).toBe('  line1\n  line2\n  line3');
    });
  });
});
