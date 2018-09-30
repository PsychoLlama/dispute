// @flow
import parseOptions from '../option-parser';
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

  it('survives if the option is unrecognized', () => {
    const root = { command() {}, options };
    const result = parse(root, ['-b']);

    expect(result.options).toEqual({});
  });
});
