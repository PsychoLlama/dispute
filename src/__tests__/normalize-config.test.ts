import normalize from '../normalize-config';

describe('Config normalizer', () => {
  const cli = {
    args: '<required>',
    command() {},
  };

  const packageJson = {
    version: '1.2.3',
  };

  it('normalizes all commands', () => {
    const config = { commandName: 'cmd', cli, packageJson };
    const result = normalize(config);

    expect(result).toMatchObject({
      cli: {
        name: config.commandName,
        args: expect.any(Array),
      },
    });
  });

  it('throws if the command name is omitted', () => {
    const config: any = { cli, packageJson };
    const fail = () => normalize(config);

    expect(fail).toThrow(/(command name|commandName)/i);
  });

  it('throws if the package is omitted', () => {
    const config: any = { commandName: 'cmd', cli };
    const fail = () => normalize(config);

    expect(fail).toThrow(/package.json/);
  });

  it('uses an empty CLI implementation if none is provided', () => {
    const config = { commandName: 'cmd', packageJson };
    const result = normalize(config);

    expect(result.cli).toMatchObject({
      subCommands: {},
      options: {},
    });

    expect(result.cli.command).toThrow(
      expect.objectContaining({
        exitCode: 1,
      })
    );
  });
});
