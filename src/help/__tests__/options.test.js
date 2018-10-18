// @flow
import normalizeConfig from '../../normalize-config';
import { describeOptionUsage } from '../options';

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
