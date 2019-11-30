import { parseArgument } from '../parse-argument';

describe('parseArgument', () => {
  it('throws if parsing fails', () => {
    const fail = () => parseArgument('-plsThrow*');

    expect(fail).toThrow(/pars(ing|er)/i);
  });

  it('includes the raw input in the parsed output', () => {
    const input = '<weird-argument>';
    const argument = parseArgument(input);

    expect(argument.raw).toBe(input);
  });

  describe('name', () => {
    it('parses the argument name', () => {
      const argument = parseArgument('<test>');

      expect(argument.name).toBe('test');
    });

    it('allows hyphens in argument names', () => {
      const argument = parseArgument('<random-name>');

      expect(argument.name).toBe('random-name');
    });

    it('allows underlines in argument names', () => {
      const argument = parseArgument('<random_name>');

      expect(argument.name).toBe('random_name');
    });

    it('allows uppercase argument names', () => {
      const argument = parseArgument('<PascalCase>');

      expect(argument.name).toBe('PascalCase');
    });

    it('throws if the name begins with a hyphen', () => {
      const fail = () => parseArgument('<-argument>');

      expect(fail).toThrow(/hyphen/i);
    });

    it('throws if the name begins with an underline', () => {
      const fail = () => parseArgument('<_argument>');

      expect(fail).toThrow(/underscore/i);
    });

    it('does not allow empty names', () => {
      const fail = () => parseArgument('<>');

      expect(fail).toThrow();
    });
  });

  describe('required', () => {
    it('indicates if the argument is required', () => {
      const argument = parseArgument('<arg>');

      expect(argument.required).toBe(true);
    });

    it('indicates if the argument is optional', () => {
      const argument = parseArgument('[arg]');

      expect(argument.required).toBe(false);
    });
  });

  describe('variadic', () => {
    it.each([
      ['optional', 'multiple', '[...name]'],
      ['optional', 'single', '[name]'],
      ['required', 'multiple', '<...name>'],
      ['required', 'single', '<name>'],
    ])(
      'indicates if the %s argument takes %s values',
      (_required, unit, input) => {
        const argument = parseArgument(input);

        expect(argument.variadic).toBe(unit === 'multiple');
      }
    );
  });
});
