// @flow
import parseUsage from '../option-usage-parser';

describe('Usage parser', () => {
  it('parses out the shorthand flag', () => {
    const usage = parseUsage('-q');

    expect(usage).toMatchObject({
      argument: null,
      long: null,
      short: 'q',
    });
  });

  it('parses out the longhand flag', () => {
    const usage = parseUsage('--quiet');

    expect(usage).toMatchObject({
      argument: null,
      long: 'quiet',
      short: null,
    });
  });

  it('throws if two flags are used without a comma', () => {
    const fail = () => parseUsage('-q --quiet');

    expect(fail).toThrow(/comma/i);
  });

  it('parses both flags if provided', () => {
    const usage = parseUsage('-q, --quiet');

    expect(usage).toMatchObject({
      long: 'quiet',
      short: 'q',
    });
  });

  it('throws if input ends after a comma', () => {
    const fail = () => parseUsage('-q,');

    expect(fail).toThrow(/end/i);
  });

  it('throws if an argument follows a comma', () => {
    const fail = () => parseUsage('-q, <command>');

    expect(fail).toThrow(/argument/i);
  });

  // Who would even try this?
  it('throws if a flag follows an equals sign', () => {
    const fail = () => parseUsage('-q=--quiet');

    expect(fail).toThrow(/flag/i);
  });

  it('parses out arguments', () => {
    const usage = parseUsage('-p <number>');

    expect(usage.argument).toMatchObject({
      required: true,
      name: 'number',
    });
  });

  it('dies if more than one short flag is provided', () => {
    const fail = () => parseUsage('-q, -s');

    expect(fail).toThrow(/flag/i);
  });

  it('dies if more than one long flag is provided', () => {
    const fail = () => parseUsage('--color, --no-color');

    expect(fail).toThrow(/flag/i);
  });

  it('dies if more than one argument is provided', () => {
    const fail = () => parseUsage('--port <number> [host]');

    expect(fail).toThrow(/argument/i);
  });

  it('dies if the flag has variadic arguments', () => {
    const fail = () => parseUsage('--port <numbers...>');

    expect(fail).toThrow(/(variadic|argument)/i);
  });
});
