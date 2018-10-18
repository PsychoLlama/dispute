// @flow
import { describeOptionUsage, describeOptions } from '../options';
import normalizeConfig from '../../normalize-config';

const createConfig = config =>
  normalizeConfig({
    packageJson: { version: '1.2.3' },
    commandName: 'unit-test',
    cli: config,
  });

describe('describeOptionUsage(...)', () => {
  const createOption = usage => {
    const config = createConfig({
      command() {},
      options: {
        normalized: { usage },
      },
    });

    return config.cli.options.normalized;
  };

  it('returns a string', () => {
    const option = createOption('--port');
    const result = describeOptionUsage(option);

    expect(result).toBe('--port');
  });

  it('describes short options', () => {
    const option = createOption('-p');
    const result = describeOptionUsage(option);

    expect(result).toBe('-p');
  });

  it('combines short and long options', () => {
    const option = createOption('--port, -p');
    const result = describeOptionUsage(option);

    expect(result).toBe('-p, --port');
  });

  it('shows required arguments', () => {
    const option = createOption('-p <port>');
    const result = describeOptionUsage(option);

    expect(result).toBe('-p <port>');
  });

  it('shows optional arguments', () => {
    const option = createOption('-q [bool]');
    const result = describeOptionUsage(option);

    expect(result).toBe('-q [bool]');
  });
});

describe('describeOptions', () => {
  const createOptions = options => {
    const { cli } = createConfig({
      command() {},
      options,
    });

    return cli.options;
  };

  it('lists all the options', () => {
    const options = createOptions({
      first: { usage: '-f' },
      second: { usage: '-s, --second' },
      third: { usage: '--third=<count>' },
    });

    const result = describeOptions(options);

    expect(result).toContain('-f');
    expect(result).toContain('-s, --second');
    expect(result).toContain('--third <count>');
  });

  it('sorts options alphabetically by long flag', () => {
    const options = createOptions({
      first: { usage: '--delta' },
      second: { usage: '-b, --charlie' },
      third: { usage: '-a' },
    });

    const result = describeOptions(options);
    const lines = result.split('\n');

    expect(lines[0]).toContain('-a');
    expect(lines[1]).toContain('charlie');
    expect(lines[2]).toContain('delta');
  });

  // "-s, --with-short"
  // "    --long-only"
  it.skip('still applies the short flag offset for long-only flags', () => {
    const options = createOptions({
      short: { usage: '-s, --with-short' },
      long: { usage: '--long-only' },
    });

    const result = describeOptions(options);
    const lines = result.split('\n');
    const shortLineIndex = /short/.test(lines[0]) ? 0 : 1;
    const longLineIndex = 1 ^ shortLineIndex;

    expect(lines[shortLineIndex]).toContain('-s, --with');
    expect(lines[longLineIndex]).toContain('    --long');
  });
});
