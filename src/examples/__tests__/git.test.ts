import cli from '../git/git';

describe('Integration test: git', () => {
  it('resolves subcommands', async () => {
    const result = await cli('commit');

    expect(result).toMatch(/opening editor/i);
  });

  it('works with options', async () => {
    const result = await cli('commit', '-m', 'Solved world hunger');

    expect(result).toMatch(/committed/i);
  });

  it('shows the help page if the command is not clear', async () => {
    await expect(cli()).rejects.toMatchObject({
      message: expect.stringMatching(/usage/i),
    });
  });

  it('passes the correct arguments', async () => {
    const revision = 'abc123';
    const result = await cli('diff', revision);

    expect(result).toContain(revision);
  });

  it('allows omitted optional arguments', async () => {
    const result = await cli('diff');

    expect(result).toMatch(/unstaged/i);
  });
});
