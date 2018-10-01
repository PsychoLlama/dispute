// @flow
import parseArgv, { normalizeArgv } from '../argv-parser';
import normalize from '../normalize-config';

const parse = (config, argv) => parseArgv(normalize(config), argv);

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
    const color = { usage: '-c' };
    const root = { command() {}, options: { ...options, color } };
    const result = parse(root, ['-qc']);

    expect(result.options).toMatchObject({
      quiet: true,
      color: true,
    });
  });

  describe('normalizeArgv(...)', () => {
    it('expands flag shorthands', () => {
      const result = normalizeArgv(['-qcp']);

      expect(result).toEqual(['-q', '-c', '-p']);
    });

    it('ignores arguments', () => {
      const argv = ['something-boring', './another', '**/symbols/*.{vim}'];

      expect(normalizeArgv(argv)).toEqual(argv);
    });

    it('ignores numerical switches', () => {
      const result = normalizeArgv(['-1337']);

      expect(result).toEqual(['-1337']);
    });

    it('leaves normal flags unchanged', () => {
      const alreadyNormalized = ['-s', '--port', '8080'];
      const result = normalizeArgv(alreadyNormalized);

      expect(result).toEqual(alreadyNormalized);
    });

    it('splits flag-value pairs', () => {
      const result = normalizeArgv(['--port=8080']);

      expect(result).toEqual(['--port', '8080']);
    });

    it('splits short conjoined pairs', () => {
      const result = normalizeArgv(['-v=./:/etc/var/app']);

      expect(result).toEqual(['-v', './:/etc/var/app']);
    });

    it('ignores "=" signs in the argument', () => {
      const result = normalizeArgv(['--chars=+,-,=']);

      expect(result).toEqual(['--chars', '+,-,=']);
    });

    it('splits conjoined pairs in short flag groups', () => {
      const result = normalizeArgv(['-vp=8080']);

      expect(result).toEqual(['-v', '-p', '8080']);
    });

    it('survives if weird things happen', () => {
      const argv = ['-zxv=./Weird Dir/=/--content', 'stuff'];
      const result = normalizeArgv(argv);

      expect(result).toEqual([
        '-z',
        '-x',
        '-v',
        './Weird Dir/=/--content',
        'stuff',
      ]);
    });
  });
});
