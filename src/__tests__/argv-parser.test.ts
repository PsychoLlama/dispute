// @flow
import * as parseValue from '../parse-value';
import normalize, { normalizeOptions } from '../normalize-commands';
import parseArgv from '../argv-parser';

const parse = (config: object, argv: any[], globalOptions = {}) =>
  parseArgv(
    normalize({ command() {}, ...config }),
    normalizeOptions({ options: globalOptions, commandPath: [] }),
    argv
  );

describe('option-parser', () => {
  const options = {
    quiet: {
      usage: '-q, --quiet',
    },
    org: {
      usage: '--org <org-name>',
    },
    increment: {
      usage: '--inc [value]',
      parseValue: parseValue.asNumber,
    },
  };

  it('returns an empty object when no options are given', () => {
    const result = parse({}, []);

    expect(result).toEqual({
      invalidOptions: [],
      globalOptions: {},
      options: {},
      args: [],
    });
  });

  it('parses out simple options', () => {
    const result = parse({ options }, ['-q']);

    expect(result.options.quiet).toBe(true);
  });

  it('parses long options', () => {
    const result = parse({ options }, ['--quiet']);

    expect(result.options.quiet).toBe(true);
  });

  it('adds invalid options to the invalid bucket', () => {
    const invalid = ['-b', '-a', '--nope'];
    const result = parse({ options }, [...invalid, '--quiet']);

    expect(result.options).toEqual({ quiet: true });
    expect(result.invalidOptions).toEqual(invalid);
  });

  it('parses conjoined short flags', () => {
    const color = { usage: '-c', parseValue: parseValue.asBoolean };
    const root = { options: { ...options, color } };
    const result = parse(root, ['-qc']);

    expect(result.options).toMatchObject({
      quiet: true,
      color: true,
    });
  });

  it('consults the custom option parser for the argument', () => {
    const result = parse({ options }, ['--inc=10']);

    expect(result.options.increment).toBe(10);
  });

  it('prefixes parse errors with the flag', () => {
    const fail = () => parse({ options }, ['--inc=wat']);

    expect(fail).toThrow(/--inc/);
  });

  it('uses "true" for options without arguments', () => {
    const result = parse({ options }, ['--quiet']);

    expect(result.options.quiet).toBe(true);
  });

  it('removes consumed arguments from the arguments list', () => {
    const root = { options, args: '[anything]' };
    const result = parse(root, ['--inc', '50', 'arg']);

    expect(result.args).toEqual(['arg']);
  });

  it('throws if a required option argument is omitted', () => {
    const fail = () => parse({ options }, ['--org']);

    expect(fail).toThrow(/org/);
  });

  it('provides a default input value if optional args are omitted', () => {
    const parseValue = jest.fn();
    const warp = { usage: '--warp [speed]', parseValue };
    const root = { options: { ...options, warp } };
    parse(root, ['--warp']);

    expect(parseValue).toHaveBeenCalledWith(
      expect.objectContaining({
        input: '',
      })
    );
  });

  it('parses out global options', () => {
    const result = parse({}, ['--help'], {
      help: { usage: '--help' },
    });

    expect(result.options).toEqual({});
    expect(result.globalOptions).toMatchObject({
      help: true,
    });
  });

  it('does not mark global options as invalid', () => {
    const result = parse({}, ['--help'], {
      help: { usage: '--help' },
    });

    expect(result.invalidOptions).toEqual([]);
  });

  it('prefers command options over global options', () => {
    const options = {
      color: { usage: '--color=<code>', parseValue: parseValue.asNumber },
    };

    const result = parse({ options }, ['--color', '5'], {
      color: { usage: '--color' },
    });

    expect(result.globalOptions).toEqual({});
    expect(result.options.color).toBe(5);
  });
});
