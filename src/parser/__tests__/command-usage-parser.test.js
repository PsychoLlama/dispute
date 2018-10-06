// @flow
import parseUsage from '../command-usage-parser';

describe('Command usage parser', () => {
  it('returns no arguments when the string is empty', () => {
    const args = parseUsage('');

    expect(args).toEqual([]);
  });

  it('parses out optional arguments', () => {
    const args = parseUsage('[dir]');

    expect(args).toEqual([
      {
        type: 'Argument',
        required: false,
        variadic: false,
        raw: '[dir]',
        name: 'dir',
      },
    ]);
  });

  it('dies if a flag enters the scene', () => {
    const fail = () => parseUsage('--port <wat>');

    expect(fail).toThrow(/(flag|port)/);
  });

  it('dies if an otherwise unexpected token appears', () => {
    const fail = () => parseUsage('<wat>=[why]');

    expect(fail).toThrow();
  });

  it('complains if required arguments follow optional', () => {
    const fail = () => parseUsage('[dir] <command>');

    expect(fail).toThrow(/(optional|required)/i);
  });

  it('works for multiple arguments', () => {
    const args = parseUsage('<dir> <type> [rest...]');

    expect(args).toHaveLength(3);
    expect(args[0]).toMatchObject({ name: 'dir', required: true });
    expect(args[1]).toMatchObject({ name: 'type', required: true });
    expect(args[2]).toMatchObject({
      required: false,
      variadic: true,
      name: 'rest',
    });
  });
});
