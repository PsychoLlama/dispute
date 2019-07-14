// @flow
import normalizeConfig from '../../normalize-config';
import { describeOptions } from '../options';

const createConfig = config =>
  normalizeConfig({
    packageJson: { version: '1.2.3' },
    commandName: 'unit-test',
    cli: config,
  });

describe('Option help output', () => {
  const getOptionsHelp = options => {
    const { cli } = createConfig({
      command() {},
      options,
    });

    return describeOptions(cli.options);
  };

  describe('describeOptions', () => {
    const describeOption = usage =>
      getOptionsHelp({
        option: { usage },
      });

    it('returns a string', () => {
      const result = describeOption('--port');

      expect(result).toEqual(expect.any(String));
    });

    it('describes short options', () => {
      const result = describeOption('-p');

      expect(result).toContain('-p');
    });

    it('combines short and long options', () => {
      const result = describeOption('--port, -p');

      expect(result).toContain('-p, --port');
    });

    it('shows required arguments', () => {
      const result = describeOption('-p <port>');

      expect(result).toContain('-p <port>');
    });

    it('shows optional arguments', () => {
      const result = describeOption('-q [bool]');

      expect(result).toContain('-q [bool]');
    });

    it('lists all the options', () => {
      const result = getOptionsHelp({
        first: { usage: '-f' },
        second: { usage: '-s, --second' },
        third: { usage: '--third=<count>' },
      });

      expect(result).toContain('-f');
      expect(result).toContain('-s, --second');
      expect(result).toContain('--third <count>');
    });

    it('sorts options alphabetically by long flag', () => {
      const result = getOptionsHelp({
        first: { usage: '--delta' },
        second: { usage: '-b, --charlie' },
        third: { usage: '-a' },
      });

      const lines = result.split('\n');

      expect(lines[0]).toContain('-a');
      expect(lines[1]).toContain('charlie');
      expect(lines[2]).toContain('delta');
    });

    // "-s, --with-short"
    // "    --long-only"
    it('still applies the short flag offset for long-only flags', () => {
      const result = getOptionsHelp({
        short: { usage: '-s, --with-short' },
        long: { usage: '--long-only' },
      });

      const lines = result.split('\n');
      const shortLineIndex = /short/.test(lines[0]) ? 0 : 1;
      const longLineIndex = 1 ^ shortLineIndex;

      expect(lines[shortLineIndex]).toContain('-s, --with');
      expect(lines[longLineIndex]).toContain('    --long');
    });

    // --long1
    // --long2
    it('skips leading flag whitespace when only long flags exist', () => {
      const result = getOptionsHelp({
        long1: { usage: '--long1' },
        long2: { usage: '--long2' },
      });

      const lines = result.split('\n');

      expect(lines[0]).toMatch(/^--long1/);
      expect(lines[1]).toMatch(/^--long2/);
    });

    it('prints descriptions if provided', () => {
      const description = 'Long flag';
      const result = getOptionsHelp({
        long: { usage: '--long', description },
      });

      expect(result).toContain(description);
    });

    it('plays nicely with multi-character short flags', () => {
      const result = getOptionsHelp({
        leet: { usage: '-1337, --leet' },
        long: { usage: '--long-flag' },
      });

      const lines = result.split('\n');

      expect(lines[1]).toMatch(/^\s{7}/);
    });
  });
});
