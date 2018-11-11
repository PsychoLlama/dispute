// @flow
import normalizeCommands from '../normalize-commands';
import createApi from '../create-api';

const toApi = config => {
  const commands = normalizeCommands(config);
  return createApi(commands);
};

describe('createApi(...)', () => {
  it('returns a function for plain commands', () => {
    const api = toApi({ command() {} });

    expect(api).toEqual(expect.any(Function));
  });

  it('calls through to commands', () => {
    const config = { command: jest.fn() };
    const sdk = toApi(config);
    sdk();

    expect(config.command).toHaveBeenCalledWith({});
  });

  it('returns an object for subcommands', () => {
    const subCommands = { add: { command: jest.fn() } };
    const api = toApi({ subCommands });

    expect(api).toMatchObject({
      add: expect.any(Function),
    });
  });

  it('returns the command value', () => {
    const add = { command: () => 5 };
    const subCommands = { add };
    const api = toApi({ subCommands });

    expect(api.add()).toBe(5);
  });

  it('passes all the arguments through', () => {
    const config = { command: jest.fn() };
    const api = toApi(config);

    const args = ['first', 'second', 'third'];
    api(...args);

    expect(config.command).toHaveBeenCalledWith(...[{}].concat(args));
  });

  it('passes the options object', () => {
    const secretName = { usage: '--public-name' };
    const shortFlag = { usage: '-m' };
    const options = { secretName, shortFlag };
    const config = { command: jest.fn(), options };
    const api = toApi(config);
    const givenOptions = { 'public-name': true, m: 'enabled' };

    api('arg', givenOptions);

    expect(config.command).toHaveBeenCalledWith(
      { secretName: true, shortFlag: 'enabled' },
      'arg'
    );
  });

  it('eats unknown options', () => {
    const config = { command: jest.fn() };
    const api = toApi(config);
    const options = { undefinedOption: true };

    api('arg', options);

    expect(config.command).toHaveBeenCalledWith({}, 'arg');
  });
});
