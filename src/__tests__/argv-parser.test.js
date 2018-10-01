// @flow
import * as parseOption from '../parse-option';
import normalize from '../normalize-config';
import parseArgv from '../argv-parser';

const parse = (config, argv) => parseArgv(normalize(config), argv);

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
      parseValue: parseOption.asNumber,
    },
  };

  it('returns an empty object when no options are given', () => {
    const result = parse({}, []);

    expect(result).toEqual({
      invalidOptions: [],
      options: {},
      args: [],
    });
  });

  it('parses out simple options', () => {
    const root = { command() {}, options };
    const result = parse(root, ['-q']);

    expect(result.options.quiet).toBe(true);
  });

  it('parses long options', () => {
    const root = { command() {}, options };
    const result = parse(root, ['--quiet']);

    expect(result.options.quiet).toBe(true);
  });

  it('adds invalid options to the invalid bucket', () => {
    const root = { command() {}, options };
    const invalid = ['-b', '-a', '--nope'];
    const result = parse(root, [...invalid, '--quiet']);

    expect(result.options).toEqual({ quiet: true });
    expect(result.invalidOptions).toEqual(invalid);
  });

  it('parses conjoined short flags', () => {
    const color = { usage: '-c', parseValue: parseOption.asBoolean };
    const root = { command() {}, options: { ...options, color } };
    const result = parse(root, ['-qc']);

    expect(result.options).toMatchObject({
      quiet: true,
      color: true,
    });
  });

  it('consults the custom option parser for the argument', () => {
    const root = { command() {}, options };
    const result = parse(root, ['--inc=10']);

    expect(result.options.increment).toBe(10);
  });

  it('prefixes parse errors with the flag', () => {
    const root = { command() {}, options };
    const fail = () => parse(root, ['--inc=wat']);

    expect(fail).toThrow(/--inc/);
  });

  it('uses "true" for options without arguments', () => {
    const root = { command() {}, options };
    const result = parse(root, ['--quiet']);

    expect(result.options.quiet).toBe(true);
  });

  it('removes consumed arguments from the arguments list', () => {
    const root = { command() {}, options };
    const result = parse(root, ['--inc', '50', 'arg']);

    expect(result.args).toEqual(['arg']);
  });

  it('throws if a required option argument is omitted', () => {
    const root = { command() {}, options };
    const fail = () => parse(root, ['--org']);

    expect(fail).toThrow(/org/);
  });

  it('provides a default input value if optional args are omitted', () => {
    const parseValue = jest.fn();
    const warp = { usage: '--warp [speed]', parseValue };
    const root = { command() {}, options: { ...options, warp } };
    parse(root, ['--warp']);

    expect(parseValue).toHaveBeenCalledWith(
      expect.objectContaining({
        input: '',
      })
    );
  });
});
