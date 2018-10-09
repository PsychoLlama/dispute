// @flow
import generateHelpPage, {
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
  describe('generateHelpPage', () => {
    it('returns a string', () => {
      const config = createConfig({});
      const result = generateHelpPage(config.cli);

      expect(result).toEqual(expect.any(String));
    });
  });

  describe('describeCommandUsage', () => {
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
  });

  describe('describeOptionUsage', () => {
    const createOption = option => {
      const config = createConfig({
        command() {},
        options: {
          normalized: option,
        },
      });

      return config.cli.options.normalized;
    };

    it('returns a string', () => {
      const option = createOption({ usage: '--port' });
      const result = describeOptionUsage(option);

      expect(result).toContain('--port');
    });
  });
});
