// @flow
const diff = async (options: {}, rev: string) => {
  if (rev) {
    return `Diff at revision "${rev}"`;
  }

  return 'Unstaged diff';
};

export default {
  args: '[revision]',
  command: diff,
};
