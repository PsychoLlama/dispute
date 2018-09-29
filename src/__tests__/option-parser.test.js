// @flow
import parseOptions, { parseOptionUsage, ArgTypes } from '../option-parser';
import normalize from '../normalize-config';

const parse = (config, argv) => parseOptions(normalize(config), argv);

describe('option-parser', () => {
  const options = {
    quiet: {
      usage: '-q, --quiet',
    },
    color: {
      usage: '--color [boolean]',
    },
  };

  it('returns an empty object when no options are given', () => {
    const result = parse({}, []);

    expect(result).toEqual({
      options: {},
      args: [],
    });
  });

  it('parses out simple options', () => {
    const root = { command() {}, options };
    const result = parse(root, ['-q']);

    expect(result.options.quiet).toBe(true);
  });

  it.skip('throws if several options share the same usage', () => {});

  describe('parseOptionUsage()', () => {
    it('returns the short and long option names', () => {
      const { fullName, shortName } = parseOptionUsage('-q, --quiet');

      expect(shortName).toBe('q');
      expect(fullName).toBe('quiet');
    });

    it('works when only the full or short name is provided', () => {
      expect(parseOptionUsage('--quiet')).toMatchObject({
        shortName: undefined,
        fullName: 'quiet',
      });

      expect(parseOptionUsage('-q')).toMatchObject({
        fullName: undefined,
        shortName: 'q',
      });
    });

    it('requires short names to be one character', () => {
      const { shortName } = parseOptionUsage('-quiet');

      expect(shortName).toBe('q');
    });

    it('allows long numbers as short names', () => {
      const { shortName } = parseOptionUsage('-1337');

      expect(shortName).toBe('1337');
    });

    it('allows numbers in full names', () => {
      const { fullName } = parseOptionUsage('--ipv6');

      expect(fullName).toBe('ipv6');
    });

    it('parses the argument type', () => {
      const { argType } = parseOptionUsage('--port <number>');

      expect(argType).toBe(ArgTypes.Required);
    });

    it('recognizes optional argument types', () => {
      const { argType } = parseOptionUsage('--color [flag]');

      expect(argType).toBe(ArgTypes.Optional);
    });
  });
});
