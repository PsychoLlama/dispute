// @flow
import * as parseOption from '../parse-value';

describe('Parse option', () => {
  const createParseError = jest.fn(
    (msg: string) => new Error(`'createParseError(...): ${msg}'`)
  );

  describe('asBoolean(...)', () => {
    const withFlag = (input: string) => ({
      createParseError,
      flag: '--color',
      input,
    });

    it('returns true with no input', () => {
      const result = parseOption.asBoolean(withFlag(''));

      expect(result).toBe(true);
    });

    it('returns false if given false', () => {
      const result = parseOption.asBoolean(withFlag('false'));

      expect(result).toBe(false);
    });

    it('parses other values as true/false', () => {
      expect(parseOption.asBoolean(withFlag('true'))).toBe(true);
      expect(parseOption.asBoolean(withFlag('yes'))).toBe(true);
      expect(parseOption.asBoolean(withFlag('on'))).toBe(true);

      expect(parseOption.asBoolean(withFlag('false'))).toBe(false);
      expect(parseOption.asBoolean(withFlag('no'))).toBe(false);
      expect(parseOption.asBoolean(withFlag('off'))).toBe(false);
    });

    it('throws if the value is invalid', () => {
      const fail = () => parseOption.asBoolean(withFlag('lolwut'));

      expect(fail).toThrow(/lolwut/);
    });
  });

  describe('asString(...)', () => {
    const withFlag = (input: string) => ({
      createParseError,
      flag: '-v',
      input,
    });

    // Reasoning: a string was expected and the user intentionally
    // didn't pass it. If it was necessary, the option argument
    // should've been listed as required. It wasn't, therefore
    // the command might provide a default. `undefined` will give
    // them the opportunity to use it.
    it('returns undefined with no input', () => {
      const result = parseOption.asString(withFlag(''));

      expect(result).toBeUndefined();
    });

    it('returns the full string content', () => {
      const input = 'some input value';
      const result = parseOption.asString(withFlag(input));

      expect(result).toBe(input);
    });
  });

  describe('asNumber(...)', () => {
    const withFlag = (input: string) => ({
      createParseError,
      flag: '--count',
      input,
    });

    it('returns undefined with no input', () => {
      const result = parseOption.asNumber(withFlag(''));

      expect(result).toBeUndefined();
    });

    it('parses the input as a number', () => {
      const result = parseOption.asNumber(withFlag('30'));

      expect(result).toBe(30);
    });

    it('accepts fancy types of numbers', () => {
      const result = parseOption.asNumber(withFlag('0xff'));

      expect(result).toBe(0xff);
    });

    it('complains if the number is invalid', () => {
      const input = withFlag('bacon');
      const fail = () => parseOption.asNumber(input);

      expect(fail).toThrow(/NaN/i);
    });

    it('rejects ±infinity', () => {
      const input = withFlag('-Infinity');
      const fail = () => parseOption.asNumber(input);

      expect(fail).toThrow(/-Infinity/i);
    });
  });
});
